const db = require('../config/database');

const createComponent = async (componentData) => {
    const { id, section_id, name, type, width, height, thickness, extension, reduction, area, volume } = componentData;
    const query = 'INSERT INTO components (id, section_id, name, type, width, height, thickness, extension, reduction, area, volume) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *';
    const values = [id, section_id, name, type, width, height, thickness, extension, reduction, area, volume];
    const { rows } = await db.query(query, values);
    return rows[0];
};

const getComponentsBySectionId = async (sectionId) => {
    const query = 'SELECT * FROM components WHERE section_id = $1';
    const { rows } = await db.query(query, [sectionId]);
    return rows;
};

module.exports = {
    createComponent,
    getComponentsBySectionId,
};
