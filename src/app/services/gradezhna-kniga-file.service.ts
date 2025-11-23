import { Injectable } from '@angular/core';
import { GradezhnaKnigaPayload } from 'src/app/models/gradezhna-kniga.model';

@Injectable({ providedIn: 'root' })
export class GradezhnaKnigaFileService {
  buildPayload(data: GradezhnaKnigaPayload): GradezhnaKnigaPayload {
    return { ...data };
  }

  downloadJson(
    payload: GradezhnaKnigaPayload,
    filename = 'gradezhna_kniga_data.json'
  ) {
    const jsonString = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    if ('showSaveFilePicker' in window) {
      (async () => {
        try {
          const options = {
            suggestedName: filename,
            types: [
              {
                description: 'JSON Files',
                accept: { 'application/json': ['.json'] },
              },
            ],
          };
          // @ts-ignore
          const handle = await window.showSaveFilePicker(options);
          const writable = await handle.createWritable();
          await writable.write(jsonString);
          await writable.close();
        } catch (err) {
          console.error('File save cancelled or failed:', err);
        }
      })();
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  parseJsonFile(file: File): Promise<GradezhnaKnigaPayload> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result as string);
          resolve(parsed as GradezhnaKnigaPayload);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }
}
