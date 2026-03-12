import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { getUserExercises, initUserExercisesCache } from './userExerciseService';

let cachedExercises = null;
let loadPromise = null;
// const csvAsset = 'updated_exercises_500';

const getAllExercisesWithUserExercises = () => {
  const csvExercises = parseCSVData();
  const userExercises = getUserExercises();
  return [...csvExercises, ...userExercises];
};

const loadCSVString = async () => {
  try {
    // if (Platform.OS === 'web') {
    //   const uri = typeof csvAsset === 'string' ? csvAsset : Asset.fromModule(csvAsset).uri;
    //   if (!uri) return '';
    //   const response = await fetch(uri);
    //   return await response.text();
    // }

    const asset = Asset.fromModule(require('./updated_exercises_500.csv'));
    console.log(asset);
    await asset.downloadAsync();
    const uri = asset.localUri || asset.uri;
    return await FileSystem.readAsStringAsync(uri);
  } catch (error) {
    console.error('Error loading CSV asset:', error);
    return '';
  }
};

export const ensureExercisesLoaded = async () => {
  if (cachedExercises !== null) {
    return cachedExercises;
  }

  if (!loadPromise) {
    loadPromise = loadCSVString()
      .then((csvString) => {
        cachedExercises = parseCSVString(csvString);
        return cachedExercises;
      })
      .then(async () => {
        await initUserExercisesCache();
        return cachedExercises;
      })
      .catch((error) => {
        console.error('Error preparing exercise data:', error);
        cachedExercises = [];
        return cachedExercises;
      });
  }

  return loadPromise;
};

const parseCSVData = () => {
  if (cachedExercises !== null) {
    return cachedExercises;
  }
  return [];
};

const parseCSVString = (csvString) => {
  if (!csvString) return [];

  try {
    const rows = csvString.trim().split('\n');
    const exercises = [];

    // Skip header row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row.trim()) continue;

      const values = parseCSVRow(row);

      if (values.length >= 5) {
        exercises.push({
          id: values[0]?.trim() || i,
          title: values[1]?.trim() || '',
          description: values[2]?.trim() || '',
          type: values[3]?.trim() || '',
          bodyPart: values[4]?.trim() || '',
          equipment: '',
          level: '',
          rating: '',
        });
      }
    }

    return exercises;
  } catch (error) {
    console.error('Error parsing exercise data:', error);
    return [];
  }
};

const parseCSVRow = (row) => {
  const result = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    const nextChar = row[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
};

export const searchExercises = (searchTerm = '') => {
  const allExercises = getAllExercisesWithUserExercises();

  if (!searchTerm.trim()) {
    return allExercises;
  }

  const term = searchTerm.toLowerCase();
  return allExercises.filter(
    (exercise) =>
      exercise.title.toLowerCase().includes(term) ||
      exercise.type.toLowerCase().includes(term) ||
      exercise.bodyPart.toLowerCase().includes(term) ||
      (exercise.equipment && exercise.equipment.toLowerCase().includes(term))
  );
};

export const getAllExercises = () => {
  return getAllExercisesWithUserExercises();
};

export const getAllExercisesExcludeAlreadyAdded = (existingExercises) => {
  const allExercises = getAllExercisesWithUserExercises();
  const existingIds = new Set(existingExercises.map((e) => e.id));
  return allExercises.filter((exercise) => !existingIds.has(exercise.id));
}

export const getBodyParts = () => {
  const exercises = parseCSVData();
  const bodyParts = new Set(exercises.map((e) => e.bodyPart).filter(Boolean));
  return Array.from(bodyParts).sort();
};

export const getExercisesByBodyPart = (bodyPart) => {
  const exercises = parseCSVData();
  return exercises.filter((e) => e.bodyPart === bodyPart);
};

export const getExerciseTypes = () => {
  const exercises = parseCSVData();
  const types = new Set(exercises.map((e) => e.type).filter(Boolean));
  return Array.from(types).sort();
};
