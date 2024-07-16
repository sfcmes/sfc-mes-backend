const { createSection, getSectionsByProjectId } = require('../queries/sectionQueries');
const { v4: uuidv4 } = require('uuid');

const addSection = async (req, res) => {
    const { project_id, name, status } = req.body;
    const sectionData = {
        id: uuidv4(),
        project_id,
        name,
        status,
    };
    try {
        console.log('Attempting to create section with data:', sectionData);
        const section = await createSection(sectionData);
        console.log('Section created successfully:', section);
        res.status(201).json({ message: 'Section created successfully', section });
    } catch (error) {
        console.error('Error creating section:', error);
        res.status(500).json({ error: 'Error creating section' });
    }
};

const getSections = async (req, res) => {
    const { projectId } = req.params;
    try {
        console.log('Fetching sections for project ID:', projectId);
        const sections = await getSectionsByProjectId(projectId);
        console.log('Sections fetched successfully:', sections);
        if (!sections.length) {
            return res.status(404).json({ error: 'No sections found for the given project ID' });
        }
        res.json(sections);
    } catch (error) {
        console.error('Error retrieving sections:', error);
        res.status(500).json({ error: 'Error retrieving sections' });
    }
};

module.exports = {
    addSection,
    getSections,
};
