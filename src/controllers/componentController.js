const { createComponent, getComponentsBySectionId } = require('../queries/componentQueries');
const { v4: uuidv4 } = require('uuid');

const addComponent = async (req, res) => {
    const { section_id, name, type, width, height, thickness, extension, reduction, area, volume } = req.body;
    const componentData = {
        id: uuidv4(),
        section_id,
        name,
        type,
        width,
        height,
        thickness,
        extension,
        reduction,
        area,
        volume,
    };
    try {
        const component = await createComponent(componentData);
        res.status(201).json({ message: 'Component created successfully', component });
    } catch (error) {
        res.status(500).json({ error: 'Error creating component' });
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
