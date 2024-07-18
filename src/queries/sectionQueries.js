// const db = require("../config/database");

// const createSection = async (sectionData) => {
//     const { id, name, project_id, status, created_at, updated_at } = sectionData;
//     const query = `
//         INSERT INTO Sections (id, name, project_id, status, created_at, updated_at)
//         VALUES ($1, $2, $3, $4, $5, $6)
//         RETURNING *;
//     `;
//     const values = [id, name, project_id, status, created_at, updated_at];
//     const result = await db.query(query, values);
//     return result.rows[0];
// };

// const getSectionsByProjectId = async (projectId) => {
//     const query = `
//         SELECT s.*, p.name as project_name 
//         FROM Sections s
//         JOIN Projects p ON s.project_id = p.id
//         WHERE project_id = $1;
//     `;
//     const result = await db.query(query, [projectId]);
//     return result.rows;
// };

// const getAllSections = async () => {
//     const query = `
//         SELECT s.*, p.name as project_name 
//         FROM Sections s
//         JOIN Projects p ON s.project_id = p.id;
//     `;
//     const result = await db.query(query);
//     return result.rows;
// };

// module.exports = {
//     createSection,
//     getSectionsByProjectId,
//     getAllSections
// };
const db = require("../config/database");

const createSection = async (sectionData) => {
    const { id, name, project_id, status, created_at, updated_at } = sectionData;
    const query = `
        INSERT INTO Sections (id, name, project_id, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
    `;
    const values = [id, name, project_id, status, created_at, updated_at];
    const result = await db.query(query, values);
    return result.rows[0];
};

const getSectionsByProjectId = async (projectId) => {
    const query = `
        SELECT s.*, p.name as project_name, COUNT(c.id) as components
        FROM Sections s
        JOIN Projects p ON s.project_id = p.id
        LEFT JOIN Components c ON s.id = c.section_id
        WHERE s.project_id = $1
        GROUP BY s.id, p.name;
    `;
    const result = await db.query(query, [projectId]);
    return result.rows;
};

const getAllSections = async () => {
    const query = `
        SELECT s.*, p.name as project_name, COUNT(c.id) as components
        FROM Sections s
        JOIN Projects p ON s.project_id = p.id
        LEFT JOIN Components c ON s.id = c.section_id
        GROUP BY s.id, p.name;
    `;
    const result = await db.query(query);
    return result.rows;
};

module.exports = {
    createSection,
    getSectionsByProjectId,
    getAllSections
};
