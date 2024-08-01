const { createComponentInDb, addComponentHistory, checkComponentExists } = require('../queries/componentQueries');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database'); 


// const addComponent = async (req, res) => {
//     const {
//         section_id, name, type, width, height, thickness, extension, reduction, area, volume, weight, status
//     } = req.body;

//     // Validate request payload
//     if (!section_id || !name || !type || !width || !height || !thickness || !extension || !reduction || !area || !volume || !weight || !status) {
//         return res.status(400).json({ error: 'Missing required fields' });
//     }

//     try {
//         // Check for existing component
//         const existingComponent = await db.query('SELECT 1 FROM Components WHERE name = $1 AND section_id = $2', [name, section_id]);
//         if (existingComponent.rows.length > 0) {
//             return res.status(400).json({ error: 'Component with the same name and section already exists' });
//         }

//         // Insert new component
//         const id = uuidv4();
//         const newComponent = await createComponentInDb({ id, section_id, name, type, width, height, thickness, extension, reduction, area, volume, weight, status });

//         // Insert component history
//         await addComponentHistory({ component_id: id, status: 'Manufactured', updated_at: new Date(), updated_by: req.user.id });

//         res.status(201).json(newComponent);
//     } catch (error) {
//         console.error('Error creating component:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// };
const addComponent = async (req, res) => {
    const {
      id,
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
  
    const query = `
      INSERT INTO Components
      (id, section_id, name, type, width, height, thickness, extension, reduction, area, volume, weight, status)
      VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `;
  
    try {
      const { rows } = await db.query(query, [id, section_id, name, type, width, height, thickness, extension, reduction, area, volume, weight, status]);
  
      // Add status history
      const historyQuery = `
        INSERT INTO component_status_history
        (id, component_id, status, updated_at, updated_by, "createdAt")
        VALUES
        ($1, $2, $3, $4, $5, $6);
      `;
      const historyId = uuidv4();
      const updatedAt = new Date();
      await db.query(historyQuery, [historyId, id, status, updatedAt, req.user.id, updatedAt]);
  
      res.status(201).json(rows[0]);
    } catch (error) {
      if (error.code === '22P02' && error.routine === 'enum_in') {
        console.error('Invalid enum value for status:', error);
        res.status(400).json({ error: 'Invalid status value. Please provide a valid status.' });
      } else {
        console.error('Error creating component:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  };
  

const getComponents = async (req, res) => {
    const { sectionId } = req.params;
    try {
        const components = await getComponentsBySectionId(sectionId);
        res.json(components);
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving components' });
    }
};

module.exports = {
    addComponent,
    getComponents,
};
