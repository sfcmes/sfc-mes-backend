const { 
  createComponentInDb, 
  addComponentHistory, 
  checkComponentExists, 
  insertComponentFile, 
  updateComponentFilePath,
  updateComponentInDb 
} = require('../queries/componentQueries');
const { createTablesIfNotExist } = require('../config/databaseInit');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const upload = multer();

const addComponent = async (req, res) => {
  console.log('Received component data:', JSON.stringify(req.body, null, 2));
  console.log('Received file:', req.file ? req.file.originalname : 'No file received');
  console.log('Request headers:', req.headers);

  const {
      section_id,
      name,
      type,
      width,
      height,
      thickness,
      extension,
      reduction,
      area,
      volume,
      weight,
      status
  } = req.body;

  // Validate required fields
  if (!section_id || !name || !type || !width || !height || !thickness || !extension || !reduction || !area || !volume || !weight) {
      return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
      // Check if the component already exists
      const componentExists = await checkComponentExists(name, section_id);
      if (componentExists) {
          return res.status(400).json({ error: 'A component with this name already exists in this section' });
      }

      const file = req.file;
      const fileName = file ? `${uuidv4()}.pdf` : null;
      let component, fileUrl, componentFile, updatedComponent;

      // Create the component
      component = await createComponentInDb({
          id: uuidv4(),
          section_id,
          name,
          type,
          width: parseInt(width),
          height: parseInt(height),
          thickness: parseInt(thickness),
          extension: parseFloat(extension),
          reduction: parseFloat(reduction),
          area: parseFloat(area),
          volume: parseFloat(volume),
          weight: parseFloat(weight),
          status: status || 'Planning'
      });

      console.log('Created component:', JSON.stringify(component, null, 2));

      // If a file is uploaded, store it in S3 and update the component file path
      if (file) {
          const params = {
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: fileName,
              Body: file.buffer,
              ContentType: file.mimetype,
          };
          const command = new PutObjectCommand(params);
          await s3.send(command);
          fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

          console.log('Uploaded file to S3:', fileUrl);

          // Insert the file URL into the component_files table
          componentFile = await insertComponentFile({
              id: uuidv4(),
              component_id: component.id,
              s3_url: fileUrl,
              revision: 1,
          });

          console.log('Inserted component file:', JSON.stringify(componentFile, null, 2));

          // Update the file_path in the components table
          updatedComponent = await updateComponentFilePath(component.id, fileUrl);

          console.log('Updated component with file path:', JSON.stringify(updatedComponent, null, 2));
      } else {
          updatedComponent = component; // If no file, use the original component object
      }

      // Add status history
      if (req.user) {
          await addComponentHistory({
              component_id: component.id,
              status: component.status,
              updated_by: req.user.id,
          });
          console.log('Added component history');
      } else {
          console.log('User not authenticated, skipping component history');
      }

      res.status(201).json(updatedComponent);
  } catch (error) {
      console.error('Error in addComponent:', error);
      let errorMessage = 'Internal Server Error';
      let statusCode = 500;

      if (error.code === '23505') {  // unique_violation
          errorMessage = 'A component with this name already exists';
          statusCode = 400;
      } else if (error.code === '23503') {  // foreign_key_violation
          errorMessage = 'Invalid section ID';
          statusCode = 400;
      }

      // If component was created but file insertion failed, we should not try to delete the component
      // as it would violate the foreign key constraint. Instead, we'll just log the error.
      if (component && !componentFile) {
          console.error('Component created but file insertion failed. Manual cleanup may be required.');
          console.error('Component ID:', component.id);
      }

      res.status(statusCode).json({ error: errorMessage, details: error.message });
  }
};

// Middleware to handle file upload
const uploadFileMiddleware = upload.single('file');

const getComponents = async (req, res) => {
  const { sectionId } = req.params;
  try {
    const components = await getComponentsBySectionId(sectionId);
    res.json(components);
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving components' });
  }
};

const getComponentsByProjectId = async (req, res) => {
  const { projectId } = req.params;
  const query = `
    SELECT c.*
    FROM components c
    JOIN sections s ON c.section_id = s.id
    WHERE s.project_id = $1
    ORDER BY c.name;
  `;
  try {
    const { rows } = await db.query(query, [projectId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No components found for this project' });
    }
    res.json(rows);
  } catch (error) {
    console.error('Error fetching components:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getComponentById = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT c.*, cf.s3_url, cf.revision
      FROM components c
      LEFT JOIN component_files cf ON c.id = cf.component_id
      WHERE c.id = $1;
    `;
    const { rows } = await db.query(query, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Component not found' });
    }
    
    // Fetch component history
    const historyQuery = `
      SELECT status, updated_at, updated_by
      FROM component_status_history
      WHERE component_id = $1
      ORDER BY updated_at DESC;
    `;
    const historyResult = await db.query(historyQuery, [id]);
    
    const component = rows[0];
    component.history = historyResult.rows;
    
    res.json(component);
  } catch (error) {
    console.error('Error fetching component:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const addComponentHistoryEndpoint = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Unauthorized: User information missing' });
  }

  const { componentId, status } = req.body;
  
  if (!componentId || !status) {
    return res.status(400).json({ error: 'Missing required fields: componentId or status' });
  }

  try {
    await addComponentHistory({
      component_id: componentId,
      status,
      updated_by: req.user.id
    });
    res.status(201).json({ message: 'Component history added successfully' });
  } catch (error) {
    console.error('Error adding component history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateComponent = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ error: 'Missing required field: status' });
  }

  try {
    const updatedComponent = await updateComponentInDb(id, { status });
    if (!updatedComponent) {
      return res.status(404).json({ error: 'Component not found' });
    }
    
    // Add component history
    await addComponentHistory({
      component_id: id,
      status: status,
      updated_by: req.user.id,
    });
    
    res.json(updatedComponent);
  } catch (error) {
    console.error('Error updating component:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  addComponent,
  getComponents,
  getComponentsByProjectId,
  uploadFileMiddleware: upload.single('file'),
  getComponentById,
  addComponentHistory: addComponentHistoryEndpoint,
  updateComponent,
};