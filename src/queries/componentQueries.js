const db = require('../config/database');
const { v4: uuidv4 } = require('uuid')

// const createComponentInDb = async (componentData) => {
//     const query = `
//         INSERT INTO Components 
//         (id, section_id, name, type, width, height, thickness, extension, reduction, area, volume, weight, status)
//         VALUES 
//         ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
//         RETURNING *;
//     `;
//     const values = [
//         uuidv4(),
//         componentData.section_id,
//         componentData.name,
//         componentData.type,
//         componentData.width,
//         componentData.height,
//         componentData.thickness,
//         componentData.extension,
//         componentData.reduction,
//         componentData.area,
//         componentData.volume,
//         componentData.weight,
//         componentData.status
//     ];

//     try {
//         const { rows } = await db.query(query, values);
//         return rows[0];
//     } catch (error) {
//         console.error('Error executing query:', error);
//         throw error;
//     }
// };
const createComponentFilesTable = async () => {
    const query = `
      CREATE TABLE IF NOT EXISTS component_files (
        id UUID PRIMARY KEY,
        component_id UUID REFERENCES components(id),
        s3_url VARCHAR(255) NOT NULL,
        revision INT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
  
    try {
      await db.query(query);
      console.log('component_files table created or already exists');
    } catch (error) {
      console.error('Error creating component_files table:', error);
      throw error;
    }
  };
  const createComponentInDb = async (componentData) => {
    const query = `
        INSERT INTO components 
        (id, section_id, name, type, width, height, thickness, extension, reduction, area, volume, weight, status)
        VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *;
    `;
    const values = [
        componentData.id,
        componentData.section_id,
        componentData.name,
        componentData.type,
        componentData.width,
        componentData.height,
        componentData.thickness,
        componentData.extension,
        componentData.reduction,
        componentData.area,
        componentData.volume,
        componentData.weight,
        componentData.status
    ];

    try {
        const { rows } = await db.query(query, values);
        return rows[0];
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
};

const getComponentsBySectionId = async (sectionId) => {
    const query = 'SELECT * FROM components WHERE section_id = $1';
    const { rows } = await db.query(query, [sectionId]);
    return rows;
};

const addComponentHistory = async ({ component_id, status, updated_by }) => {
    const query = `
      INSERT INTO component_status_history 
      (id, component_id, status, updated_by, updated_at, created_at)
      VALUES ($1, $2, $3, $4, $5, $6);
    `;
  
    const id = uuidv4();
    const now = new Date();
    const values = [id, component_id, status, updated_by, now, now];
  
    console.log('Executing history query with values:', values);
  
    try {
      await db.query(query, values);
    } catch (error) {
      console.error('Error executing history query:', error);
      throw error;
    }
  };

const checkComponentExists = async (name, sectionId) => {
    const query = `
        SELECT 1
        FROM Components
        WHERE name = $1 AND section_id = $2;
    `;
    const values = [name, sectionId];
    try {
        const { rows } = await db.query(query, values);
        return rows.length > 0;
    } catch (error) {
        console.error('Error checking component existence:', error); // More detailed logging
        throw error;
    }
};

const insertComponentFile = async ({ id, component_id, s3_url, revision }) => {
    const query = `
      INSERT INTO component_files (id, component_id, s3_url, revision)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [id, component_id, s3_url, revision];
  
    console.log('Attempting to insert component file with values:', JSON.stringify(values, null, 2));

    try {
      const result = await db.query(query, values);
      console.log('Query execution result:', JSON.stringify(result, null, 2));
      
      if (result.rows.length > 0) {
        console.log('Successfully inserted component file:', JSON.stringify(result.rows[0], null, 2));
        return result.rows[0];
      } else {
        throw new Error('No rows returned after insertion');
      }
    } catch (error) {
      console.error('Error inserting component file:');
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error constraint:', error.constraint);
      console.error('Error detail:', error.detail);
      console.error('Error hint:', error.hint);
      console.error('Error position:', error.position);
      console.error('Error where:', error.where);
      console.error('Error schema:', error.schema);
      console.error('Error table:', error.table);
      console.error('Error column:', error.column);
      console.error('Error dataType:', error.dataType);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      throw error;
    }
};

const updateComponentFilePath = async (componentId, filePath) => {
    const query = `
        UPDATE components
        SET file_path = $1
        WHERE id = $2
        RETURNING *;
    `;
    const values = [filePath, componentId];

    try {
        const { rows } = await db.query(query, values);
        if (rows.length > 0) {
            console.log('Successfully updated component file path:', JSON.stringify(rows[0], null, 2));
            return rows[0];
        } else {
            throw new Error('No rows returned after update');
        }
    } catch (error) {
        console.error('Error updating component file path:', error);
        throw error;
    }
};

const updateComponentInDb = async (id, updateData) => {
    const query = `
      UPDATE components
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *;
    `;
    const values = [updateData.status, id];
    try {
      const { rows } = await db.query(query, values);
      return rows[0];
    } catch (error) {
      console.error('Error updating component in database:', error);
      throw error;
    }
  };

module.exports = {
    createComponentInDb,
    getComponentsBySectionId,
    addComponentHistory,
    checkComponentExists,
    insertComponentFile,updateComponentFilePath,
    updateComponentInDb  ,
};
