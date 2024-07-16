const { createProject, getAllProjects, getProjectById } = require('../queries/projectQueries');
const { v4: uuidv4 } = require('uuid');

// Utility function for validation
const validateProjectData = (data) => {
    const { name, description } = data;
    if (!name || !description) {
        throw new Error('Name and description are required');
    }
};

const addProject = async (req, res) => {
    const { name, description } = req.body;
    
    try {
        validateProjectData({ name, description });
        
        const projectData = {
            id: uuidv4(),
            name,
            description,
            created_by: req.user.id,
        };
        
        console.log('Attempting to create project with data:', projectData);
        const project = await createProject(projectData);
        console.log('Project created successfully:', project);
        res.status(201).json({ message: 'Project created successfully', project });
    } catch (error) {
        console.error('Error creating project:', error);
        const statusCode = error.message === 'Name and description are required' ? 400 : 500;
        res.status(statusCode).json({ error: error.message || 'Error creating project' });
    }
};

const getProjects = async (req, res) => {
    try {
        console.log('Fetching all projects');
        const projects = await getAllProjects();
        console.log('Projects fetched successfully:', projects);
        res.json(projects);
    } catch (error) {
        console.error('Error retrieving projects:', error);
        res.status(500).json({ error: 'Error retrieving projects' });
    }
};

const getProject = async (req, res) => {
    const { id } = req.params;
    try {
        console.log('Fetching project with ID:', id);
        const project = await getProjectById(id);
        if (!project) {
            console.log('Project not found with ID:', id);
            return res.status(404).json({ error: 'Project not found' });
        }
        console.log('Project fetched successfully:', project);
        res.json(project);
    } catch (error) {
        console.error('Error retrieving project:', error);
        res.status(500).json({ error: 'Error retrieving project' });
    }
};

module.exports = {
    addProject,
    getProjects,
    getProject,
};
