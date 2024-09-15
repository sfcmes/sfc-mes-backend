const db = require("../config/database");

const getStatusIdByName = async (statusName) => {
  const query = "SELECT id FROM other_component_statuses WHERE name = $1";
  const { rows } = await db.query(query, [statusName]);
  return rows[0]?.id;
};

const getProjectsWithOtherComponents = async () => {
  const query = `
    SELECT 
      p.id AS project_id, 
      p.project_code, 
      p.name AS project_name,
      oc.id AS component_id,
      oc.name AS component_name,
      oc.total_quantity,
      ocst.status_id,
      ocst.quantity,
      ocs.name AS status_name
    FROM 
      projects p
    INNER JOIN 
      other_components oc ON p.id = oc.project_id
    INNER JOIN 
      other_component_status_tracking ocst ON oc.id = ocst.other_component_id
    INNER JOIN 
      other_component_statuses ocs ON ocst.status_id = ocs.id
    ORDER BY 
      p.project_code, oc.name, ocs.name
  `;

  const { rows } = await db.query(query);
  return rows;
};

// const updateOtherComponentStatus = async (componentId, fromStatus, toStatus, quantity, userId) => {
//   const client = await db.getClient();

//   try {
//     await client.query("BEGIN");

//     const fromStatusId = await getStatusIdByName(fromStatus);
//     const toStatusId = await getStatusIdByName(toStatus);

//     // Decrease quantity in the 'from' status
//     const { rowCount: fromRowCount } = await client.query(
//       `UPDATE other_component_status_tracking
//        SET quantity = quantity - $1
//        WHERE other_component_id = $2 AND status_id = $3`,
//       [quantity, componentId, fromStatusId]
//     );

//     if (fromRowCount === 0) {
//       throw new Error(`No records found for status ${fromStatus}`);
//     }

//     // Increase quantity in the 'to' status
//     const { rowCount: toRowCount } = await client.query(
//       `UPDATE other_component_status_tracking
//        SET quantity = quantity + $1
//        WHERE other_component_id = $2 AND status_id = $3`,
//       [quantity, componentId, toStatusId]
//     );

//     // If the 'to' status didn't exist, insert a new row
//     if (toRowCount === 0) {
//       await client.query(
//         `INSERT INTO other_component_status_tracking (other_component_id, status_id, quantity, created_by)
//          VALUES ($1, $2, $3, $4)`,
//         [componentId, toStatusId, quantity, userId]
//       );
//     }

//     // Fetch updated component data
//     const { rows: [updatedComponent] } = await client.query(
//       "SELECT * FROM other_components WHERE id = $1",
//       [componentId]
//     );

//     // Fetch updated statuses
//     const { rows: statuses } = await client.query(
//       `SELECT ocs.name, ocst.quantity 
//        FROM other_component_status_tracking ocst 
//        JOIN other_component_statuses ocs ON ocst.status_id = ocs.id 
//        WHERE ocst.other_component_id = $1`,
//       [componentId]
//     );

//     await client.query("COMMIT");

//     return {
//       ...updatedComponent,
//       statuses: statuses.reduce((acc, status) => ({ ...acc, [status.name]: status.quantity }), {})
//     };
//   } catch (error) {
//     await client.query("ROLLBACK");
//     console.error('Error in updateOtherComponentStatus:', error);
//     throw error;
//   } finally {
//     client.release();
//   }
// };

const updateOtherComponentStatus = async (componentId, fromStatus, toStatus, quantity, userId) => {
  const client = await db.getClient();

  try {
    await client.query("BEGIN");

    const fromStatusId = await getStatusIdByName(fromStatus);
    const toStatusId = await getStatusIdByName(toStatus);

    // Fetch the total quantity of the component
    const { rows: [component] } = await client.query(
      "SELECT total_quantity FROM other_components WHERE id = $1",
      [componentId]
    );
    const totalQuantity = component.total_quantity;

    // Fetch current quantities for all statuses
    const { rows: currentStatuses } = await client.query(
      `SELECT ocs.name, ocst.quantity 
       FROM other_component_status_tracking ocst 
       JOIN other_component_statuses ocs ON ocst.status_id = ocs.id 
       WHERE ocst.other_component_id = $1`,
      [componentId]
    );

    const currentQuantities = currentStatuses.reduce((acc, status) => {
      acc[status.name] = status.quantity;
      return acc;
    }, {});

    // Calculate total quantity excluding 'manufactured' and 'transported'
    const totalExcludingManufacturedAndTransported = Object.entries(currentQuantities)
      .filter(([status]) => status !== 'manufactured' && status !== 'transported')
      .reduce((sum, [, value]) => sum + value, 0);

    // Check if the update would exceed 100% for statuses other than 'manufactured' and 'transported'
    if (toStatus !== 'manufactured' && toStatus !== 'transported') {
      if (totalExcludingManufacturedAndTransported - (fromStatus !== 'manufactured' && fromStatus !== 'transported' ? quantity : 0) + quantity > totalQuantity) {
        throw new Error("Update would exceed 100% of total quantity");
      }
    }

    // Decrease quantity in the 'from' status, except when it's 'manufactured' or 'transported'
    if (fromStatus !== 'manufactured' && fromStatus !== 'transported') {
      await client.query(
        `UPDATE other_component_status_tracking
         SET quantity = quantity - $1
         WHERE other_component_id = $2 AND status_id = $3`,
        [quantity, componentId, fromStatusId]
      );
    }

    // Increase quantity in the 'to' status
    if (toStatus === 'manufactured' || toStatus === 'transported') {
      // For 'manufactured' and 'transported', allow exceeding 100% but cap at 100%
      const currentToQuantity = currentQuantities[toStatus] || 0;
      const newQuantity = Math.min(currentToQuantity + quantity, totalQuantity);
      const actualIncrease = newQuantity - currentToQuantity;

      await client.query(
        `INSERT INTO other_component_status_tracking (other_component_id, status_id, quantity, created_by)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (other_component_id, status_id) 
         DO UPDATE SET quantity = LEAST(other_component_status_tracking.quantity + $3, $5)`,
        [componentId, toStatusId, actualIncrease, userId, totalQuantity]
      );

      // If moving from 'manufactured' to 'transported', update 'manufactured' as well
      if (fromStatus === 'manufactured' && toStatus === 'transported') {
        await client.query(
          `UPDATE other_component_status_tracking
           SET quantity = LEAST(quantity + $1, $2)
           WHERE other_component_id = $3 AND status_id = $4`,
          [actualIncrease, totalQuantity, componentId, fromStatusId]
        );
      }
    } else {
      // For other statuses, just add the quantity
      await client.query(
        `INSERT INTO other_component_status_tracking (other_component_id, status_id, quantity, created_by)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (other_component_id, status_id) 
         DO UPDATE SET quantity = other_component_status_tracking.quantity + $3`,
        [componentId, toStatusId, quantity, userId]
      );
    }

    // Fetch updated component data
    const { rows: [updatedComponent] } = await client.query(
      "SELECT * FROM other_components WHERE id = $1",
      [componentId]
    );

    // Fetch updated statuses
    const { rows: statuses } = await client.query(
      `SELECT ocs.name, ocst.quantity 
       FROM other_component_status_tracking ocst 
       JOIN other_component_statuses ocs ON ocst.status_id = ocs.id 
       WHERE ocst.other_component_id = $1`,
      [componentId]
    );

    await client.query("COMMIT");

    return {
      ...updatedComponent,
      statuses: statuses.reduce((acc, status) => ({ ...acc, [status.name]: status.quantity }), {})
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error('Error in updateOtherComponentStatus:', error);
    throw error;
  } finally {
    client.release();
  }
};

const createOtherComponent = async (data) => {
  const client = await db.getClient();
  try {
    await client.query("BEGIN");

    // Create other component
    const { rows: [newComponent] } = await client.query(`
      INSERT INTO other_components 
      (project_id, name, width, height, thickness, total_quantity, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [data.project_id, data.name, data.width, data.height, data.thickness, data.total_quantity, data.created_by]);

    // Add planning status
    const planningStatusId = await getStatusIdByName("planning");
    await client.query(
      "INSERT INTO other_component_status_tracking (other_component_id, status_id, quantity, created_by) VALUES ($1, $2, $3, $4)",
      [newComponent.id, planningStatusId, newComponent.total_quantity, newComponent.created_by]
    );

    // Fetch status data
    const { rows: [status] } = await client.query(
      "SELECT ocs.name, ocst.quantity FROM other_component_status_tracking ocst JOIN other_component_statuses ocs ON ocst.status_id = ocs.id WHERE ocst.other_component_id = $1",
      [newComponent.id]
    );

    await client.query("COMMIT");

    return { ...newComponent, status: { [status.name]: status.quantity } };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error('Error in createOtherComponent:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getProjectsWithOtherComponents,
  updateOtherComponentStatus,
  createOtherComponent,
  getStatusIdByName,
};