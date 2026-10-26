import { Recipe, Ingredient } from '../types';

export const parseCSVData = (csvText: string): Recipe[] => {
  console.log('Starting CSV parsing...');
  
  const lines = csvText.split('\n').filter(line => line.trim());
  console.log('Total lines:', lines.length);
  
  if (lines.length === 0) {
    console.error('No lines found in CSV');
    return [];
  }
  
  const headers = parseCSVLine(lines[0]);
  console.log('Headers:', headers);
  
  const recipes: Recipe[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);
      
      if (values.length < 9) {
        console.warn(`Line ${i + 1} has insufficient columns:`, values.length);
        continue;
      }
      
      const ingredients = parseIngredients(values[1] || ''); // ingredients is second column
      
      const recipe: Recipe = {
        id: i, // Use line number as ID
        name: (values[0] || `Recipe ${i}`).trim(),
        ingredients,
        diet: (values[2] || 'unknown').trim(),
        prepTime: parseInt(values[3]) || 0,
        cookTime: parseInt(values[4]) || 0,
        flavorProfile: (values[5] || 'unknown').trim(),
        course: (values[6] || 'unknown').trim(),
        state: (values[7] || 'unknown').trim(),
        region: (values[8] || 'unknown').trim()
      };
      
      console.log(`Parsed recipe ${i}:`, recipe.name, 'with', recipe.ingredients.length, 'ingredients');
      recipes.push(recipe);
      
    } catch (error) {
      console.error(`Error parsing line ${i + 1}:`, error);
      continue;
    }
  }
  
  console.log('Total recipes parsed:', recipes.length);
  return recipes;
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  result.push(current.trim());
  return result;
};

const parseIngredients = (ingredientString: string): Ingredient[] => {
  if (!ingredientString || ingredientString.trim() === '') {
    return [];
  }
  
  const ingredients: Ingredient[] = [];
  
  // Remove quotes if present
  let cleanString = ingredientString.replace(/^["']|["']$/g, '');
  
  // Split by comma, but be careful with commas inside ingredient descriptions
  const parts = cleanString.split(',');
  
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    
    // Try to extract amount and unit using various patterns
    const patterns = [
      // Pattern: "Ingredient Name 500g"
      /^(.+?)\s+(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/,
      // Pattern: "Ingredient Name 500 g"
      /^(.+?)\s+(\d+(?:\.\d+)?)\s+([a-zA-Z]+)$/,
      // Pattern: "500g Ingredient Name"
      /^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)\s+(.+)$/,
      // Pattern: "Ingredient Name (500g)"
      /^(.+?)\s*\((\d+(?:\.\d+)?)\s*([a-zA-Z]+)\)$/
    ];
    
    let matched = false;
    
    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match) {
        let name, amount, unit;
        
        if (pattern === patterns[2]) { // Amount first pattern
          amount = parseFloat(match[1]);
          unit = match[2].toLowerCase();
          name = match[3].trim();
        } else {
          name = match[1].trim();
          amount = parseFloat(match[2]);
          unit = match[3].toLowerCase();
        }
        
        ingredients.push({
          name: name,
          amount: amount,
          unit: unit
        });
        
        matched = true;
        break;
      }
    }
    
    if (!matched) {
      // If no pattern matches, try to extract just numbers
      const numberMatch = trimmed.match(/(\d+(?:\.\d+)?)/);
      if (numberMatch) {
        const amount = parseFloat(numberMatch[1]);
        const name = trimmed.replace(/\d+(?:\.\d+)?/g, '').trim();
        
        ingredients.push({
          name: name || trimmed,
          amount: amount,
          unit: 'g' // default unit
        });
      } else {
        // Just use the whole string as ingredient name with default amount
        ingredients.push({
          name: trimmed,
          amount: 1,
          unit: 'piece'
        });
      }
    }
  }
  
  return ingredients;
};