// src/pages/EnrollmentPage.tsx
import React, { useState } from 'react';
import { Box, Typography, Paper, Button, Alert } from '@mui/material';
import { SchoolIcon, PersonAdd as EnrollIcon } from '@mui/icons-material';
import { useYears } from '@/features/academics/hooks/useYears';
import ThreeTierEnrollmentManager from '@/components/enrollment/ThreeTierEnrollmentManager';
import StudentGrid from '@/components/students/StudentGrid';

export default function EnrollmentPage() {
  const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<any[]>([]);

  const { data: academicYears = [] } = useYears();
  const activeYear = academicYears.find(year => year.is_active);

  const handleOpenEnrollment = () => {
    if (selectedStudents.length === 0) {
      alert('Please select students to enroll');
      return;
    }
    setEnrollmentDialogOpen(true);
  };

  const handleEnrollmentComplete = (results: any) => {
    console.log('Enrollment completed:', results);
    setEnrollmentDialogOpen(false);
    setSelectedStudents([]);
  };

  return (
    <Box sx={{ margin: '0 auto', maxWidth: 1300 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SchoolIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" component="h1">
                Student Enrollment Management
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                Three-tier enrollment system for comprehensive student management
              </Typography>
              {activeYear && (
                <Typography variant="body2" color="primary" sx={{ mt: 0.5 }}>
                  Academic Year: {activeYear.name}
                </Typography>
              )}
            </Box>
          </Box>

          <Button
            variant="contained"
            startIcon={<EnrollIcon />}
            onClick={handleOpenEnrollment}
            disabled={selectedStudents.length === 0}
            size="large"
          >
            Enroll Selected Students ({selectedStudents.length})
          </Button>
        </Box>
      </Paper>

      {!activeYear && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No active academic year found. Please set an active academic year before enrolling students.
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Select Students for Enrollment
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Select one or more students below, then click "Enroll Selected Students" to begin the enrollment process.
        </Typography>

        <StudentGrid
          selectedStudents={selectedStudents}
          onStudentSelectionChange={setSelectedStudents}
          showActions={false}
          selectionMode="multiple"
        />
      </Paper>

      {/* Three-Tier Enrollment Dialog */}
      {enrollmentDialogOpen && activeYear && (
        <ThreeTierEnrollmentManager
          students={selectedStudents}
          academicYearId={activeYear.id}
          academicYearName={activeYear.name}
          open={enrollmentDialogOpen}
          onClose={() => setEnrollmentDialogOpen(false)}
          onEnrollmentComplete={handleEnrollmentComplete}
        />
      )}
    </Box>
  );
}