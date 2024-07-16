const db = require('../config/database');

const createSection = async (sectionData) => {
    const { id, project_id, name, status } = sectionData;
    const query = 'INSERT INTO sections (id, project_id, name, status) VALUES ($1, $2, $3, $4) RETURNING *';
    const values = [id, project_id, name, status];
    console.log('Executing query:', query, 'with values:', values);
    const { rows } = await db.query(query, values);
    return rows[0];
};

const getSectionsByProjectId = async (projectId) => {
    const query = 'SELECT * FROM sections WHERE project_id = $1';
    console.log('Executing query:', query, 'with projectId:', projectId);
    const { rows } = await db.query(query, [projectId]);
    return rows;
};

const querySectionsByProjectId = async (projectId) => {
    const { rows } = await db.query(
      'SELECT * FROM sections WHERE project_id = $1',
      [projectId]
    );
    return rows;
  };

module.exports = {
    createSection,
    getSectionsByProjectId,
    querySectionsByProjectId
};
