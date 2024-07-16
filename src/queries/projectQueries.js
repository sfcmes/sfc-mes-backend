const pool = require('../config/database');

const createProject = async (projectData) => {
    const { id, name, description, created_by } = projectData;
    const result = await pool.query(
        'INSERT INTO projects (id, name, description, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
        [id, name, description, created_by]
    );
    return result.rows[0];
};

const getAllProjects = async () => {
    const result = await pool.query('SELECT * FROM projects');
    return result.rows;
};

const getProjectById = async (id) => {
    const result = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    return result.rows[0];
};

module.exports = {
    createProject,
    getAllProjects,
    getProjectById,
};
