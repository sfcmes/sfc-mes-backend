const db = require("../config/database");

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
        FROM Projects p
        LEFT JOIN Sections s ON p.id = s.project_id
        LEFT JOIN (
            SELECT 
                c.section_id, 
                COUNT(c.id) AS total_components, 
                SUM(CASE WHEN csh.status = 'Completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(c.id) AS progress
            FROM Components c
            LEFT JOIN (
                SELECT 
                    csh.component_id, 
                    MAX(csh.updated_at) AS latest_update
                FROM ComponentStatusHistory csh
                WHERE csh.status = 'Completed'
                GROUP BY csh.component_id
            ) latest_status ON c.id = latest_status.component_id
            LEFT JOIN ComponentStatusHistory csh ON c.id = csh.component_id AND csh.updated_at = latest_status.latest_update
            GROUP BY c.section_id
        ) section_progress ON s.id = section_progress.section_id
        LEFT JOIN Components c ON s.id = c.section_id
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
FROM Projects p
LEFT JOIN Sections s ON p.id = s.project_id
LEFT JOIN (
    SELECT
        c.section_id,
        COUNT(c.id) AS total_components,
        SUM(CASE WHEN csh.status = 'Completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(c.id) AS progress
    FROM Components c
    LEFT JOIN (
        SELECT
            csh.component_id,
            MAX(csh.updated_at) AS latest_update
        FROM ComponentStatusHistory csh
        WHERE csh.status = 'Completed'
        GROUP BY csh.component_id
    ) latest_status ON c.id = latest_status.component_id
    LEFT JOIN ComponentStatusHistory csh ON c.id = csh.component_id AND csh.updated_at = latest_status.latest_update
    GROUP BY c.section_id
) section_progress ON s.id = section_progress.section_id
LEFT JOIN Components c ON s.id = c.section_id
GROUP BY p.id;

    `;
  const { rows } = await db.query(query, [id]);
  return rows[0];
};

const createProject = async (projectData) => {
  const { id, name, project_code, created_by } = projectData;
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

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProjectById,
};
