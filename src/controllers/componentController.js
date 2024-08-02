const { 
  createComponentInDb, 
  addComponentHistory, 
  checkComponentExists, 
  insertComponentFile, 
  updateComponentFilePath  // Make sure this is imported
} = require('../queries/componentQueries');
const { createTablesIfNotExist } = require('../config/databaseInit');  // Adjust this path as needed
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

  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'File is required' });
  }

  const fileName = `${uuidv4()}.pdf`;
  let component, fileUrl, componentFile, updatedComponent;

  try {
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
      status: status || 'Planning'  // Use the provided status or default to 'Planning'
    });

    console.log('Created component:', JSON.stringify(component, null, 2));

    // Upload file to S3
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

    // Add status history
    await addComponentHistory({
      component_id: component.id,
      status: component.status,
      updated_by: req.user.id,
    });

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
      WHERE s.project_id = $1;
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

module.exports = {
    addComponent,
    getComponents,
    getComponentsByProjectId,
    uploadFileMiddleware: upload.single('file'),
};