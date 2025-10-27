import { TrainingPlan } from '../types';

/**
 * Exports a training plan as JSON file
 */
export function exportToJSON(plan: TrainingPlan): void {
  const jsonString = JSON.stringify(plan, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${plan.event.name.replace(/[^a-z0-9]/gi, '_')}_Trainingsplan.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Imports a training plan from JSON file
 */
export function importFromJSON(file: File): Promise<TrainingPlan> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const plan = JSON.parse(content) as TrainingPlan;

        // Validate the plan structure
        if (!plan.event || !plan.weeks || !Array.isArray(plan.weeks)) {
          throw new Error('Ungültiges Trainingsplan-Format');
        }

        resolve(plan);
      } catch (error) {
        reject(new Error('Fehler beim Laden der Datei: ' + (error as Error).message));
      }
    };

    reader.onerror = () => {
      reject(new Error('Fehler beim Lesen der Datei'));
    };

    reader.readAsText(file);
  });
}
