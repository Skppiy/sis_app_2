// Fill these with your real paths/fields. The rest of the app reads this config.
export type FieldDef = {
    name: string;                 // JSON field name from API
    label: string;                // UI label
    type: 'string' | 'number' | 'boolean' | 'date';
    required?: boolean;
    readOnly?: boolean;
  };
  
  export type EntityContract = {
    path: string;                 // e.g., "/academic-years"
    primaryKey: string;           // e.g., "id"
    listSelect?: string[];        // subset of fields to show; if omitted, we try to infer
    formFields?: FieldDef[];      // fields to render in CRUD modal
  };
  
  export const contracts = {
    years: {
      path: '/academic-years',
      primaryKey: 'id',
      listSelect: ['name', 'start_date', 'end_date', 'is_active'],
      formFields: [
        { name: 'name', label: 'Name', type: 'string', required: true },
        { name: 'start_date', label: 'Start Date', type: 'date', required: true },
        { name: 'end_date', label: 'End Date', type: 'date', required: true },
        { name: 'is_active', label: 'Active', type: 'boolean' }
      ]
    } as EntityContract,
  
    subjects: {
      path: '/subjects',
      primaryKey: 'id',
      listSelect: ['name', 'code'],
      formFields: [
        { name: 'name', label: 'Name', type: 'string', required: true },
        { name: 'code', label: 'Code', type: 'string', required: true }
      ]
    } as EntityContract,
  
    classrooms: {
      path: '/classrooms',
      primaryKey: 'id',
      listSelect: ['name', 'grade_level', 'capacity'],
      formFields: [
        { name: 'name', label: 'Name', type: 'string', required: true },
        { name: 'grade_level', label: 'Grade Level', type: 'string' },
        { name: 'capacity', label: 'Capacity', type: 'number' }
      ]
    } as EntityContract,
  
    rooms: {
      path: '/rooms',
      primaryKey: 'id',
      listSelect: ['name', 'building', 'capacity', 'in_use'],
      formFields: [
        { name: 'name', label: 'Room Name', type: 'string', required: true },
        { name: 'building', label: 'Building', type: 'string' },
        { name: 'capacity', label: 'Capacity', type: 'number' },
        { name: 'in_use', label: 'In Use', type: 'boolean' }
      ]
    } as EntityContract,
  
    students: {
      path: '/students',
      primaryKey: 'id',
      listSelect: ['first_name', 'last_name', 'grade_level'],
      formFields: [
        { name: 'first_name', label: 'First Name', type: 'string', required: true },
        { name: 'last_name', label: 'Last Name', type: 'string', required: true },
        { name: 'grade_level', label: 'Grade Level', type: 'string' }
      ]
    } as EntityContract,
  };
  
  export type Contracts = typeof contracts;
  