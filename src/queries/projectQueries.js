const db = require("../config/database");
const { v4: uuidv4 } = require('uuid');

const getAllProjects = async () => {
  const query = `
    SELECT 
        p.id, 
        p.name, 
        p.project_code AS project_code, 
        p.created_by, 
        p.created_at, 
        p.updated_at,
        COALESCE(AVG(section_progress.progress), 0) AS progress,
        COUNT(DISTINCT s.id) AS sections,
        COUNT(c.id) AS components,
        CASE 
            WHEN COUNT(DISTINCT s.id) = 0 THEN 'Planning'
            WHEN SUM(CASE WHEN s.status = 'Completed' THEN 1 ELSE 0 END) = COUNT(DISTINCT s.id) AND COUNT(DISTINCT s.id) > 0 THEN 'Completed'
            ELSE 'In Progress'
        END as status
    FROM projects p
    LEFT JOIN sections s ON p.id = s.project_id
    LEFT JOIN (
        SELECT 
            c.section_id, 
            COUNT(c.id) AS total_components, 
            SUM(CASE WHEN csh.status = 'Installed' THEN 1 ELSE 0 END) * 100.0 / COUNT(c.id) AS progress
        FROM components c
        LEFT JOIN (
            SELECT 
                csh.component_id, 
                MAX(csh.updated_at) AS latest_update
            FROM component_status_history csh
            WHERE csh.status = 'Installed'
            GROUP BY csh.component_id
        ) latest_status ON c.id = latest_status.component_id
        LEFT JOIN component_status_history csh ON c.id = csh.component_id AND csh.updated_at = latest_status.latest_update
        GROUP BY c.section_id
    ) section_progress ON s.id = section_progress.section_id
    LEFT JOIN components c ON s.id = c.section_id
    GROUP BY p.id
  `;
  try {
    const { rows } = await db.query(query);
    return rows;
  } catch (error) {
    console.error("Error executing getAllProjects query:", error);
    throw error;
  }
};



const getProjectById = async (id) => {
  const query = `
    SELECT
      p.id,
      p.name,
      p.project_code AS project_code,
      p.created_by,
      p.created_at,
      p.updated_at,
      COALESCE(AVG(section_progress.progress), 0) AS progress,
      COUNT(DISTINCT s.id) AS sections,
      COUNT(c.id) AS components,
      CASE
          WHEN COUNT(DISTINCT s.id) = 0 THEN 'Planning'
          WHEN SUM(CASE WHEN s.status = 'Completed' THEN 1 ELSE 0 END) = COUNT(DISTINCT s.id) AND COUNT(DISTINCT s.id) > 0 THEN 'Completed'
          ELSE 'In Progress'
      END as status
    FROM projects p
    LEFT JOIN sections s ON p.id = s.project_id
    LEFT JOIN (
        SELECT
          c.section_id,
          COUNT(c.id) AS total_components,
          SUM(CASE WHEN csh.status = 'Installed' THEN 1 ELSE 0 END) * 100.0 / COUNT(c.id) AS progress
        FROM components c
        LEFT JOIN (
            SELECT
              csh.component_id,
              MAX(csh.updated_at) AS latest_update
            FROM component_status_history csh
            WHERE csh.status = 'Installed'
            GROUP BY csh.component_id
        ) latest_status ON c.id = latest_status.component_id
        LEFT JOIN component_status_history csh ON c.id = csh.component_id AND csh.updated_at = latest_status.latest_update
        GROUP BY c.section_id
    ) section_progress ON s.id = section_progress.section_id
    LEFT JOIN components c ON s.id = c.section_id
    GROUP BY p.id
    HAVING p.id = $1;
  `;
  try {
    const { rows } = await db.query(query, [id]);
    return rows[0];
  } catch (error) {
    console.error('Error executing getProjectById query:', error);
    throw error;
  }
};

module.exports = {
  getProjectById,
};


const createProject = async (projectData) => {
  const { name, project_code, created_by } = projectData;
  const id = projectData.id || uuidv4(); // Generate UUID if not provided
  const query =
    "INSERT INTO Projects (id, name, project_code, created_by) VALUES ($1, $2, $3, $4) RETURNING *";
  const values = [id, name, project_code, created_by];
  const { rows } = await db.query(query, values);
  return rows[0];
};

const updateProjectById = async (id, projectData) => {
  const { name, project_code } = projectData;
  const query =
    "UPDATE Projects SET name = $2, project_code = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *";
  const values = [id, name, project_code];
  const { rows } = await db.query(query, values);
  return rows[0];
};

const checkProjectExists = async (projectId) => {
  const query = 'SELECT EXISTS(SELECT 1 FROM Projects WHERE id = $1)';
  const result = await db.query(query, [projectId]);
  return result.rows[0].exists;
};

// Function to add a new image URL for a project
const addProjectImage = async (projectId, imageUrl) => {
  const query = `
    INSERT INTO project_images (project_id, image_url)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const values = [projectId, imageUrl];
  try {
    const { rows } = await db.query(query, values);
    return rows[0];
  } catch (error) {
    console.error('Error inserting project image:', error);
    throw error;
  }
};

// Function to get all images for a specific project
const getProjectImages = async (projectId) => {
  const query = `
    SELECT * FROM project_images
    WHERE project_id = $1;
  `;
  try {
    const { rows } = await db.query(query, [projectId]);
    return rows;
  } catch (error) {
    console.error('Error fetching project images:', error);
    throw error;
  }
};

const deleteProjectById = async (projectId) => {
  try {
      await db.query('BEGIN'); // Start a transaction

      // First delete from component_status_history
      await db.query(`
          DELETE FROM component_status_history WHERE component_id IN (
              SELECT id FROM components WHERE section_id IN (
                  SELECT id FROM sections WHERE project_id = $1
              )
          )
      `, [projectId]);

      // Then delete from component_files
      await db.query(`
          DELETE FROM component_files WHERE component_id IN (
              SELECT id FROM components WHERE section_id IN (
                  SELECT id FROM sections WHERE project_id = $1
              )
          )
      `, [projectId]);

      // Then delete from components
      await db.query(`
          DELETE FROM components WHERE section_id IN (
              SELECT id FROM sections WHERE project_id = $1
          )
      `, [projectId]);

      // Then delete from sections
      await db.query(`
          DELETE FROM sections WHERE project_id = $1
      `, [projectId]);

      // Finally delete the project
      await db.query(`
          DELETE FROM projects WHERE id = $1
      `, [projectId]);

      await db.query('COMMIT'); // Commit the transaction
  } catch (error) {
      await db.query('ROLLBACK'); // Rollback the transaction on error
      console.error('Error deleting project and related data:', error);
      throw error;
  }
};


module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProjectById,
  checkProjectExists,
  addProjectImage,
  getProjectImages,
  deleteProjectById,
};
