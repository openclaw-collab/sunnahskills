export interface RegistrationData {
  id: number;
  program_id: string;
  program_name: string;
  form_data: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const exportToCSV = (registrations: RegistrationData[], filename: string = 'registrations.csv') => {
  if (registrations.length === 0) {
    return;
  }

  // Parse form data and create headers
  const allFields = new Set<string>();
  const parsedData = registrations.map(reg => {
    try {
      const formData = JSON.parse(reg.form_data);
      Object.keys(formData).forEach(key => allFields.add(key));
      return {
        id: reg.id,
        program_id: reg.program_id,
        program_name: reg.program_name,
        status: reg.status,
        created_at: reg.created_at,
        updated_at: reg.updated_at,
        ...formData
      };
    } catch (error) {
      return {
        id: reg.id,
        program_id: reg.program_id,
        program_name: reg.program_name,
        status: reg.status,
        created_at: reg.created_at,
        updated_at: reg.updated_at,
        error: 'Failed to parse form data'
      };
    }
  });

  // Create CSV headers
  const headers = [
    'ID',
    'Program ID',
    'Program Name',
    'Status',
    'Created At',
    'Updated At',
    ...Array.from(allFields).map(field => 
      field.replace(/([A-Z])/g, ' $1').trim()
    )
  ];

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...parsedData.map(row => 
      headers.map(header => {
        const key = header.toLowerCase().replace(/\s+/g, '');
        const value = row[key as keyof typeof row];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    )
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};