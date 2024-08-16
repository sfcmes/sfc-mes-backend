const { getAllProjects, getProjectById, createProject, updateProjectById, addProjectImage, getProjectImages } = require('../queries/projectQueries');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

// Configure S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

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

const uploadProjectImage = async (req, res) => {
  const projectId = req.params.id;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // Generate a unique file name
    const fileName = `${uuidv4()}-${file.originalname}`;
    
    // Prepare S3 upload parameters
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `projects/${projectId}/${fileName}`,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    // Upload to S3
    const command = new PutObjectCommand(params);
    await s3.send(command);

    const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/projects/${projectId}/${fileName}`;

    // Store the image URL in the database
    const projectImage = await addProjectImage(projectId, imageUrl);

    res.status(201).json(projectImage);
  } catch (error) {
    console.error('Error uploading project image:', error);
    res.status(500).json({ error: 'Error uploading project image' });
  }
};

const getProjectImagesController = async (req, res) => {
  const projectId = req.params.id;

  try {
    const images = await getProjectImages(projectId);
    res.json(images);
  } catch (error) {
    console.error('Error fetching project images:', error);
    res.status(500).json({ error: 'Error fetching project images' });
  }
};

module.exports = {
  getProjects,
  getProject,
  addProject,
  updateProject,
  uploadProjectImage,
  getProjectImagesController,
};
