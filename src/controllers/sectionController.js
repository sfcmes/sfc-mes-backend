// const { createSection, getSectionsByProjectId, getAllSections } = require('../queries/sectionQueries');
// const { v4: uuidv4 } = require('uuid');

// const addSection = async (req, res) => {
//     const { name, project_id, status } = req.body;
//     try {
//         if (!name || !project_id || !status) {
//             return res.status(400).json({ error: 'Name, project_id, and status are required' });
//         }

//         const newSection = {
//             id: uuidv4(),
//             name,
//             project_id,
//             status,
//             created_at: new Date(),
//             updated_at: new Date(),
//         };

//         const section = await createSection(newSection);
//         res.status(201).json({ message: 'Section created successfully', section });
//     } catch (error) {
//         console.error('Error creating section:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// };

// const getSections = async (req, res) => {
//     try {
//         const sections = await getAllSections();
//         res.json(sections);
//     } catch (error) {
//         res.status(500).json({ error: 'Error retrieving sections' });
//     }
// };

// const getSectionsByProject = async (req, res) => {
//     const { projectId } = req.params;
//     try {
//         const sections = await getSectionsByProjectId(projectId);
//         res.json(sections);
//     } catch (error) {
//         res.status(500).json({ error: 'Error retrieving sections for project' });
//     }
// };

// module.exports = {
//     addSection,
//     getSections,
//     getSectionsByProject
// };
const { createSection, getSectionsByProjectId, getAllSections } = require('../queries/sectionQueries');
const { v4: uuidv4 } = require('uuid');

const addSection = async (req, res) => {
    const { name, project_id, status } = req.body;
    try {
        if (!name || !project_id || !status) {
            return res.status(400).json({ error: 'Name, project_id, and status are required' });
        }

        const newSection = {
            id: uuidv4(),
            name,
            project_id,
            status,
            created_at: new Date(),
            updated_at: new Date(),
        };

        const section = await createSection(newSection);
        res.status(201).json({ message: 'Section created successfully', section });
    } catch (error) {
        console.error('Error creating section:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getSections = async (req, res) => {
    try {
        const sections = await getAllSections();
        res.json(sections);
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving sections' });
    }
};

const getSectionsByProject = async (req, res) => {
    const { projectId } = req.params;
    try {
        const sections = await getSectionsByProjectId(projectId);
        res.json(sections);
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving sections for project' });
    }
};

module.exports = {
    addSection,
    getSections,
    getSectionsByProject
};
