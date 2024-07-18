const { createProject, getAllProjects, getProjectById, updateProjectById } = require('../queries/projectQueries');
const { v4: uuidv4 } = require('uuid');

const validateProjectData = (data) => {
    const { name, project_code } = data;
    if (!name || !project_code) {
        throw new Error('Name and project code are required');
    }
};

const addProject = async (req, res) => {
    const { name, project_code } = req.body;
    try {
        validateProjectData({ name, project_code });
        const projectData = {
            id: uuidv4(),
            name,
            project_code,
            created_by: req.user.id,
        };
        const project = await createProject(projectData);
        res.status(201).json({ message: 'Project created successfully', project });
    } catch (error) {
        const statusCode = error.message === 'Name and project code are required' ? 400 : 500;
        res.status(statusCode).json({ error: error.message || 'Error creating project' });
    }
};

const getProjects = async (req, res) => {
    try {
        const projects = await getAllProjects();
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving projects' });
    }
};

const getProject = async (req, res) => {
    const { id } = req.params;
    try {
        const project = await getProjectById(id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving project' });
    }
};

const updateProject = async (req, res) => {
    const { id } = req.params;
    const { name, project_code } = req.body;
    try {
        validateProjectData({ name, project_code });
        const project = await updateProjectById(id, { name, project_code });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json({ message: 'Project updated successfully', project });
    } catch (error) {
        res.status(500).json({ error: 'Error updating project' });
    }
};

module.exports = {
    addProject,
    getProjects,
    getProject,
    updateProject,
};
