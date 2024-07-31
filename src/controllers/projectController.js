const { getAllProjects, getProjectById, createProject, updateProjectById } = require('../queries/projectQueries');

// Function to get all projects
const getProjects = async (req, res) => {
  try {
    const projects = await getAllProjects();
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Error retrieving projects' });
  }
};

// Function to get a project by ID
const getProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Error retrieving project' });
  }
};

// Function to create a new project
const addProject = async (req, res) => {
  try {
    const projectData = req.body;
    const newProject = await createProject(projectData);
    res.status(201).json(newProject);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Error creating project' });
  }
};

// Function to update a project by ID
const updateProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const projectData = req.body;
    const updatedProject = await updateProjectById(projectId, projectData);
    res.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Error updating project' });
  }
};

module.exports = {
  getProjects,
  getProject,
  addProject,
  updateProject,
};
