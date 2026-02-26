import AsyncStorage from '@react-native-async-storage/async-storage';

const TEMPLATES_KEY = 'arc_templates';

/**
 * Get all stored workout templates.
 * @returns {Promise<Array>} List of template objects; [] on missing/invalid data or error.
 */
export const getTemplates = async () => {
  try {
    const stored = await AsyncStorage.getItem(TEMPLATES_KEY);
    if (stored == null) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error reading templates:', error);
    return [];
  }
};

/**
 * Overwrite stored templates with the given array.
 * @param {Array} templates - Full list of templates to save.
 * @returns {Promise<void>}
 */
export const saveTemplates = async (templates) => {
  try {
    await AsyncStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  } catch (error) {
    console.error('Error saving templates:', error);
    throw error;
  }
};

/**
 * Append a single template to stored templates.
 * @param {Object} template - Template object: { id?, title, createdAt?, exercises }.
 * @returns {Promise<void>}
 */
export const addTemplate = async (template) => {
  try {
    const existing = await getTemplates();
    const withId = {
      ...template,
      id: template.id || `template_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: template.createdAt || new Date().toISOString(),
    };
    existing.push(withId);
    await saveTemplates(existing);
  } catch (error) {
    console.error('Error adding template:', error);
    throw error;
  }
};
