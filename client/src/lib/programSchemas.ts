export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'select' | 'textarea' | 'checkbox';
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface ProgramSchema {
  id: string;
  name: string;
  fields: FormField[];
}

export const programSchemas: ProgramSchema[] = [
  {
    id: 'bjj',
    name: 'Brazilian Jiu-Jitsu',
    fields: [
      {
        name: 'firstName',
        label: 'First Name',
        type: 'text',
        required: true,
        placeholder: 'Enter first name'
      },
      {
        name: 'lastName',
        label: 'Last Name',
        type: 'text',
        required: true,
        placeholder: 'Enter last name'
      },
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        placeholder: 'Enter email address'
      },
      {
        name: 'phone',
        label: 'Phone Number',
        type: 'tel',
        required: true,
        placeholder: 'Enter phone number'
      },
      {
        name: 'age',
        label: 'Age',
        type: 'number',
        required: true,
        validation: { min: 6, max: 17 }
      },
      {
        name: 'gender',
        label: 'Gender',
        type: 'select',
        required: true,
        options: ['Male', 'Female', 'Other']
      },
      {
        name: 'experienceLevel',
        label: 'Experience Level',
        type: 'select',
        required: true,
        options: ['Beginner', 'Some Experience', 'Intermediate', 'Advanced']
      },
      {
        name: 'preferredClass',
        label: 'Preferred Class Type',
        type: 'select',
        required: true,
        options: ['Gi (Traditional)', 'No-Gi', 'Both']
      },
      {
        name: 'emergencyContact',
        label: 'Emergency Contact Name',
        type: 'text',
        required: true,
        placeholder: 'Parent/Guardian name'
      },
      {
        name: 'emergencyPhone',
        label: 'Emergency Contact Phone',
        type: 'tel',
        required: true,
        placeholder: 'Emergency contact phone'
      },
      {
        name: 'medicalConditions',
        label: 'Medical Conditions (if any)',
        type: 'textarea',
        required: false,
        placeholder: 'Please list any medical conditions, allergies, or injuries we should be aware of'
      },
      {
        name: 'goals',
        label: 'What are your goals for BJJ training?',
        type: 'textarea',
        required: false,
        placeholder: 'Self-defense, competition, fitness, etc.'
      }
    ]
  },
  {
    id: 'archery',
    name: 'Seasonal Archery',
    fields: [
      {
        name: 'firstName',
        label: 'First Name',
        type: 'text',
        required: true,
        placeholder: 'Enter first name'
      },
      {
        name: 'lastName',
        label: 'Last Name',
        type: 'text',
        required: true,
        placeholder: 'Enter last name'
      },
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        placeholder: 'Enter email address'
      },
      {
        name: 'phone',
        label: 'Phone Number',
        type: 'tel',
        required: true,
        placeholder: 'Enter phone number'
      },
      {
        name: 'age',
        label: 'Age',
        type: 'number',
        required: true,
        validation: { min: 8, max: 18 }
      },
      {
        name: 'season',
        label: 'Preferred Season',
        type: 'select',
        required: true,
        options: ['Summer', 'Fall', 'Both']
      },
      {
        name: 'previousExperience',
        label: 'Previous Archery Experience',
        type: 'select',
        required: true,
        options: ['None', 'Some', 'Intermediate', 'Advanced']
      },
      {
        name: 'equipmentOwned',
        label: 'Equipment Owned',
        type: 'select',
        required: true,
        options: ['None', 'Bow Only', 'Bow and Arrows', 'Full Set']
      },
      {
        name: 'parentName',
        label: 'Parent/Guardian Name',
        type: 'text',
        required: true,
        placeholder: 'Parent or guardian name'
      },
      {
        name: 'parentPhone',
        label: 'Parent/Guardian Phone',
        type: 'tel',
        required: true,
        placeholder: 'Parent or guardian phone'
      },
      {
        name: 'allergies',
        label: 'Allergies (if any)',
        type: 'textarea',
        required: false,
        placeholder: 'Please list any allergies we should be aware of'
      },
      {
        name: 'motivation',
        label: 'What motivates you to learn archery?',
        type: 'textarea',
        required: false,
        placeholder: 'Competition, recreation, focus training, etc.'
      }
    ]
  },
  {
    id: 'outdoor',
    name: 'Outdoor Workshops',
    fields: [
      {
        name: 'firstName',
        label: 'First Name',
        type: 'text',
        required: true,
        placeholder: 'Enter first name'
      },
      {
        name: 'lastName',
        label: 'Last Name',
        type: 'text',
        required: true,
        placeholder: 'Enter last name'
      },
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        placeholder: 'Enter email address'
      },
      {
        name: 'phone',
        label: 'Phone Number',
        type: 'tel',
        required: true,
        placeholder: 'Enter phone number'
      },
      {
        name: 'age',
        label: 'Age',
        type: 'number',
        required: true,
        validation: { min: 10, max: 18 }
      },
      {
        name: 'workshopInterest',
        label: 'Workshop Interests',
        type: 'select',
        required: true,
        options: ['Fire Building', 'Shelter Building', 'Navigation', 'Knot Tying', 'All of the Above']
      },
      {
        name: 'outdoorExperience',
        label: 'Outdoor Experience Level',
        type: 'select',
        required: true,
        options: ['Beginner', 'Some Camping', 'Regular Hiker', 'Experienced Outdoorsperson']
      },
      {
        name: 'parentName',
        label: 'Parent/Guardian Name',
        type: 'text',
        required: true,
        placeholder: 'Parent or guardian name'
      },
      {
        name: 'parentPhone',
        label: 'Parent/Guardian Phone',
        type: 'tel',
        required: true,
        placeholder: 'Parent or guardian phone'
      },
      {
        name: 'medicalConditions',
        label: 'Medical Conditions & Allergies',
        type: 'textarea',
        required: false,
        placeholder: 'Please list any medical conditions, allergies, or medications we should be aware of'
      },
      {
        name: 'fears',
        label: 'Any Fears or Concerns',
        type: 'textarea',
        required: false,
        placeholder: 'Heights, insects, being alone, etc.'
      },
      {
        name: 'goals',
        label: 'What do you hope to learn?',
        type: 'textarea',
        required: false,
        placeholder: 'Survival skills, confidence building, nature connection, etc.'
      }
    ]
  },
  {
    id: 'bullyproofing',
    name: 'Bullyproofing Workshops',
    fields: [
      {
        name: 'firstName',
        label: 'Child\'s First Name',
        type: 'text',
        required: true,
        placeholder: 'Enter child\'s first name'
      },
      {
        name: 'lastName',
        label: 'Child\'s Last Name',
        type: 'text',
        required: true,
        placeholder: 'Enter child\'s last name'
      },
      {
        name: 'age',
        label: 'Child\'s Age',
        type: 'number',
        required: true,
        validation: { min: 6, max: 16 }
      },
      {
        name: 'school',
        label: 'School Name',
        type: 'text',
        required: true,
        placeholder: 'Enter school name'
      },
      {
        name: 'grade',
        label: 'Grade Level',
        type: 'select',
        required: true,
        options: ['Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade', '6th Grade', '7th Grade', '8th Grade', '9th Grade', '10th Grade']
      },
      {
        name: 'parentName',
        label: 'Parent/Guardian Name',
        type: 'text',
        required: true,
        placeholder: 'Parent or guardian name'
      },
      {
        name: 'parentEmail',
        label: 'Parent/Guardian Email',
        type: 'email',
        required: true,
        placeholder: 'Parent or guardian email'
      },
      {
        name: 'parentPhone',
        label: 'Parent/Guardian Phone',
        type: 'tel',
        required: true,
        placeholder: 'Parent or guardian phone'
      },
      {
        name: 'emergencyContact',
        label: 'Emergency Contact (if different)',
        type: 'text',
        required: false,
        placeholder: 'Name and phone number'
      },
      {
        name: 'bullyingExperience',
        label: 'Has your child experienced bullying?',
        type: 'select',
        required: true,
        options: ['Yes', 'No', 'Not Sure']
      },
      {
        name: 'specificConcerns',
        label: 'Specific Concerns or Situations',
        type: 'textarea',
        required: false,
        placeholder: 'Please describe any specific bullying situations or concerns'
      },
      {
        name: 'goals',
        label: 'What do you hope your child will learn?',
        type: 'textarea',
        required: false,
        placeholder: 'Confidence building, verbal skills, physical techniques, etc.'
      },
      {
        name: 'medicalInfo',
        label: 'Medical Information',
        type: 'textarea',
        required: false,
        placeholder: 'Any medical conditions, allergies, or injuries we should be aware of'
      }
    ]
  }
];

export const getProgramSchema = (programId: string): ProgramSchema | undefined => {
  return programSchemas.find(schema => schema.id === programId);
};