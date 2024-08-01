const { createComponentInDb, addComponentHistory, checkComponentExists } = require('../queries/componentQueries');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database'); 


const addComponent = async (req, res) => {
    const {
        section_id, name, type, width, height, thickness, extension, reduction, area, volume, weight, status
    } = req.body;

    // Validate request payload
    if (!section_id || !name || !type || !width || !height || !thickness || !extension || !reduction || !area || !volume || !weight || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Check for existing component
        const existingComponent = await db.query('SELECT 1 FROM Components WHERE name = $1 AND section_id = $2', [name, section_id]);
        if (existingComponent.rows.length > 0) {
            return res.status(400).json({ error: 'Component with the same name and section already exists' });
        }

        // Insert new component
        const id = uuidv4();
        const newComponent = await createComponentInDb({ id, section_id, name, type, width, height, thickness, extension, reduction, area, volume, weight, status });

        // Insert component history
        await addComponentHistory({ component_id: id, status: 'Manufactured', updated_at: new Date(), updated_by: req.user.id });

        res.status(201).json(newComponent);
    } catch (error) {
        console.error('Error creating component:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getComponents = async (req, res) => {
    const { sectionId } = req.params;
    try {
        const components = await getComponentsBySectionId(sectionId);
        res.json(components);
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving components' });
    }
};

module.exports = {
    addComponent,
    getComponents,
};
