import AsyncStorage from '@react-native-async-storage/async-storage';

const TEMPLATES_KEY = 'arc_templates';

/**
 * Get all stored workout templates.
 * @returns {Promise<Array>} List of template objects; [] on missing/invalid data or error.
 */
export const getTemplates = async (user) => {
  // try {
  //   const stored = await AsyncStorage.getItem(TEMPLATES_KEY);
  //   if (stored == null) return [];
  //   const parsed = JSON.parse(stored);
  //   return Array.isArray(parsed) ? parsed : [];
  // } catch (error) {
  //   console.error('Error reading templates:', error);
  //   return [];
  // }

  try{
    const res = await fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/workout-templates/get-templates', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${await user.getIdToken()}`,
        'Content-Type': 'application/json'
      },
    });
    const data = await res.json();
    console.log(data);
    return Array.isArray(data) ? data : [];
  }
  catch (error) {
    console.error('Error fetching templates from backend:', error);
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
  }
};

/**
 * Append a single template to stored templates.
 * @param {Object} user - user object from the getAuth of Firebase.
 * @param {Object} template - Template object: { id?, title, createdAt?, exercises }.
 * @returns {Promise<void>}
 */
export const addTemplate = async (user, template) => {
  try {
    const res = await fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/workout-templates/add-template', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await user.getIdToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(template)
    });

    console.log(res);
  } catch (error) {
    console.error('Error adding template:', error);
  }
};
