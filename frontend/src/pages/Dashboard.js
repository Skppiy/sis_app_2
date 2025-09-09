import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { Typography, Paper, Box, Card, CardContent, Stack, Chip, Avatar, List, ListItem, ListItemText, ListItemAvatar, Alert, LinearProgress, Divider, Button, alpha, useTheme, Grid } from '@mui/material';
import { Person as TeacherIcon, Group as StudentsIcon, School as HomeRoomIcon, SportsBasketball as SpecialistIcon, Warning as AlertIcon, Assignment as AssignmentIcon, School } from '@mui/icons-material';
import { Link } from '@tanstack/react-router';
import { useAuth } from '@/auth/AuthContext';
import { useTeachers } from '@/features/academics/hooks/useTeachers';
import { useStudents } from '@/features/enrollment/hooks/useStudents';
import { listClassrooms } from '@/features/academics/services/classrooms';
export default function Dashboard() {
    const { activeSchool } = useAuth();
    const theme = useTheme();
    // Fetch teachers and students data
    const { data: teachers = [], isLoading: teachersLoading } = useTeachers({
        school_id: activeSchool?.id,
        is_active: true
    });
    const { data: students = [], isLoading: studentsLoading } = useStudents({
        school_id: activeSchool?.id,
        is_active: true
    });
    // State for enrollment calculations
    const [enrollmentStats, setEnrollmentStats] = React.useState({
        totalEnrolled: 0,
        assignedStudents: 0,
        unassignedStudents: 0,
        calculationComplete: false
    });
    // Calculate real enrollment statistics
    React.useEffect(() => {
        const calculateEnrollmentStats = async () => {
            if (!activeSchool?.id || students.length === 0) {
                setEnrollmentStats({
                    totalEnrolled: 0,
                    assignedStudents: 0,
                    unassignedStudents: 0,
                    calculationComplete: true
                });
                return;
            }
            try {
                // Get all classrooms to understand current assignments
                const classrooms = await listClassrooms();
                const totalEnrollments = classrooms.reduce((sum, classroom) => {
                    return sum + (classroom.enrollment_count || 0);
                }, 0);
                // For more accurate calculations, we could fetch individual student enrollments
                // but for performance, we'll use the classroom enrollment counts
                const assignedCount = totalEnrollments;
                const totalStudents = students.length;
                const unassignedCount = Math.max(0, totalStudents - assignedCount);
                setEnrollmentStats({
                    totalEnrolled: totalStudents,
                    assignedStudents: assignedCount,
                    unassignedStudents: unassignedCount,
                    calculationComplete: true
                });
            }
            catch (error) {
                console.warn('[Dashboard] Failed to calculate enrollment stats:', error);
                // Fallback to simple is_active calculation with better logic
                const activeStudents = students.filter(s => s.is_active).length;
                const totalStudents = students.length;
                setEnrollmentStats({
                    totalEnrolled: totalStudents,
                    assignedStudents: activeStudents, // Better than before but still approximate
                    unassignedStudents: totalStudents - activeStudents,
                    calculationComplete: true
                });
            }
        };
        calculateEnrollmentStats();
    }, [students, activeSchool?.id]);
    // Calculate statistics
    const totalTeachers = teachers.length;
    const homeroomTeachers = teachers.filter(t => !t.is_specialist && t.grade_level);
    const specialistTeachers = teachers.filter(t => t.is_specialist);
    const unassignedTeachers = teachers.filter(t => !t.is_specialist && !t.grade_level);
    // Use calculated enrollment statistics
    const totalStudents = enrollmentStats.totalEnrolled;
    const assignedStudents = enrollmentStats.assignedStudents;
    const unassignedStudents = enrollmentStats.unassignedStudents;
    const assignmentCompletionRate = totalStudents > 0 ? Math.round((assignedStudents / totalStudents) * 100) : 0;
    // Get teachers sorted by student count for highlights
    const teachersByLoad = [...teachers]
        .filter(t => t.student_count > 0)
        .sort((a, b) => (b.student_count || 0) - (a.student_count || 0))
        .slice(0, 5);
    const StatCard = ({ title, value, subtitle, icon, color, action }) => (_jsx(Card, { sx: {
            height: '100%',
            background: `linear-gradient(135deg, ${alpha(color, 0.02)} 0%, ${alpha(color, 0.05)} 100%)`,
            border: `1px solid ${alpha(color, 0.12)}`,
            transition: 'all 0.3s ease',
            '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 8px 25px ${alpha(color, 0.15)}`,
            }
        }, children: _jsx(CardContent, { sx: { p: 3 }, children: _jsxs(Stack, { direction: "row", alignItems: "flex-start", justifyContent: "space-between", children: [_jsxs(Stack, { spacing: 1, sx: { flex: 1 }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", sx: { fontWeight: 500 }, children: title }), _jsx(Typography, { variant: "h3", sx: { fontWeight: 600, color }, children: value }), subtitle && (_jsx(Typography, { variant: "body2", color: "text.secondary", children: subtitle })), action && (_jsx(Button, { component: Link, to: action.to, size: "small", sx: { mt: 1, alignSelf: 'flex-start' }, children: action.label }))] }), _jsx(Avatar, { sx: { bgcolor: alpha(color, 0.1), color }, children: icon })] }) }) }));
    return (_jsxs(Box, { sx: { py: 1 }, children: [_jsxs(Box, { sx: { mb: 4 }, children: [_jsx(Typography, { variant: "h4", sx: { fontWeight: 600, mb: 1 }, children: "School Admin Dashboard" }), _jsx(Typography, { variant: "body1", color: "text.secondary", children: "Overview of teacher assignments and student enrollment status" })] }), _jsxs(Grid, { container: true, spacing: 3, sx: { mb: 4 }, children: [_jsx(Grid, { size: { xs: 12, md: 3 }, children: _jsx(StatCard, { title: "Total Teachers", value: totalTeachers, subtitle: `${homeroomTeachers.length} homeroom, ${specialistTeachers.length} specialists`, icon: _jsx(TeacherIcon, {}), color: theme.palette.primary.main, action: { label: "Manage Teachers", to: "/app/teachers" } }) }), _jsx(Grid, { size: { xs: 12, md: 3 }, children: _jsx(StatCard, { title: "Total Students", value: totalStudents, subtitle: `${assignedStudents} assigned, ${unassignedStudents} pending`, icon: _jsx(StudentsIcon, {}), color: theme.palette.info.main, action: { label: "View Students", to: "/app/students" } }) }), _jsx(Grid, { size: { xs: 12, md: 3 }, children: _jsx(StatCard, { title: "Assignment Rate", value: `${assignmentCompletionRate}%`, subtitle: "Students assigned to teachers", icon: _jsx(AssignmentIcon, {}), color: assignmentCompletionRate > 80 ? theme.palette.success.main : theme.palette.warning.main }) }), _jsx(Grid, { size: { xs: 12, md: 3 }, children: _jsx(StatCard, { title: "Unassigned Teachers", value: unassignedTeachers.length, subtitle: "Awaiting grade/room assignment", icon: _jsx(AlertIcon, {}), color: unassignedTeachers.length > 0 ? theme.palette.error.main : theme.palette.success.main }) })] }), _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { size: { xs: 12, lg: 7 }, children: _jsxs(Paper, { sx: { p: 3, height: '100%' }, children: [_jsxs(Stack, { direction: "row", alignItems: "center", justifyContent: "space-between", sx: { mb: 3 }, children: [_jsx(Typography, { variant: "h6", sx: { fontWeight: 600 }, children: "Teacher Assignments" }), _jsx(Button, { component: Link, to: "/app/teachers", size: "small", children: "View All Teachers" })] }), (teachersLoading || !enrollmentStats.calculationComplete) ? (_jsxs(Box, { sx: { py: 4, textAlign: 'center' }, children: [_jsx(LinearProgress, { sx: { mb: 2 } }), _jsx(Typography, { color: "text.secondary", children: teachersLoading ? 'Loading teachers...' : 'Calculating enrollment statistics...' })] })) : teachersByLoad.length > 0 ? (_jsx(List, { sx: { p: 0 }, children: teachersByLoad.map((teacher, index) => (_jsxs(React.Fragment, { children: [_jsxs(ListItem, { sx: { px: 0, py: 1.5 }, children: [_jsx(ListItemAvatar, { children: _jsx(Avatar, { sx: {
                                                                bgcolor: teacher.is_specialist
                                                                    ? theme.palette.secondary.main
                                                                    : theme.palette.primary.main
                                                            }, children: teacher.is_specialist ? _jsx(SpecialistIcon, {}) : _jsx(HomeRoomIcon, {}) }) }), _jsx(ListItemText, { primary: _jsxs(Stack, { direction: "row", alignItems: "center", spacing: 2, children: [_jsxs(Typography, { variant: "subtitle1", sx: { fontWeight: 500 }, children: [teacher.first_name, " ", teacher.last_name] }), _jsx(Chip, { size: "small", label: `${teacher.student_count || 0} students`, color: teacher.student_count > 25 ? "warning" : "success" })] }), secondary: teacher.is_specialist
                                                            ? `${teacher.specialist_subject || 'Specialist'} • ${teacher.specialist_room_name || 'No room assigned'}`
                                                            : `Grade ${teacher.grade_level || 'TBD'} • ${teacher.homeroom_name || 'No room assigned'}` })] }), index < teachersByLoad.length - 1 && _jsx(Divider, {})] }, teacher.id))) })) : (_jsx(Box, { sx: { py: 4, textAlign: 'center' }, children: _jsx(Typography, { color: "text.secondary", children: "No teacher assignments found. Add teachers and assign them to grades/rooms to see data here." }) }))] }) }), _jsx(Grid, { size: { xs: 12, lg: 5 }, children: _jsxs(Stack, { spacing: 3, children: [_jsxs(Paper, { sx: { p: 3 }, children: [_jsx(Typography, { variant: "h6", sx: { fontWeight: 600, mb: 2 }, children: "Assignment Progress" }), _jsxs(Box, { sx: { mb: 2 }, children: [_jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", sx: { mb: 1 }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Student Assignment Completion" }), _jsxs(Typography, { variant: "body2", sx: { fontWeight: 500 }, children: [assignedStudents, " of ", totalStudents] })] }), _jsx(LinearProgress, { variant: "determinate", value: assignmentCompletionRate, sx: { height: 8, borderRadius: 4 } })] }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: enrollmentStats.calculationComplete
                                                ? `${assignmentCompletionRate}% of students have classroom assignments`
                                                : 'Calculating assignment rates...' })] }), (unassignedTeachers.length > 0 || unassignedStudents > 0) && (_jsxs(Paper, { sx: { p: 3 }, children: [_jsx(Typography, { variant: "h6", sx: { fontWeight: 600, mb: 2 }, children: "Action Required" }), _jsxs(Stack, { spacing: 2, children: [unassignedTeachers.length > 0 && (_jsx(Alert, { severity: "warning", action: _jsx(Button, { component: Link, to: "/app/teachers", size: "small", children: "Assign" }), children: _jsxs(Typography, { variant: "body2", children: [unassignedTeachers.length, " teacher", unassignedTeachers.length !== 1 ? 's' : '', " need grade/room assignments"] }) })), unassignedStudents > 0 && (_jsx(Alert, { severity: "info", action: _jsx(Button, { component: Link, to: "/app/students", size: "small", children: "View" }), children: _jsxs(Typography, { variant: "body2", children: [unassignedStudents, " student", unassignedStudents !== 1 ? 's' : '', " awaiting teacher assignment"] }) }))] })] })), _jsxs(Paper, { sx: { p: 3 }, children: [_jsx(Typography, { variant: "h6", sx: { fontWeight: 600, mb: 2 }, children: "Quick Actions" }), _jsxs(Stack, { spacing: 1, children: [_jsx(Button, { component: Link, to: "/app/teachers", startIcon: _jsx(TeacherIcon, {}), fullWidth: true, variant: "outlined", children: "Add New Teacher" }), _jsx(Button, { component: Link, to: "/app/students", startIcon: _jsx(StudentsIcon, {}), fullWidth: true, variant: "outlined", children: "Manage Student Enrollments" }), _jsx(Button, { component: Link, to: "/app/classrooms", startIcon: _jsx(School, {}), fullWidth: true, variant: "outlined", children: "Setup Classrooms" })] })] })] }) })] })] }));
}
