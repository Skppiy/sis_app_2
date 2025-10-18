// src/features/enrollment/utils/accommodationUtils.ts
import { getStudentServiceAssignments } from '@/features/academics/services/studentServices';

/**
 * Check if a student requires accommodations based on their active Student Services assignments
 */
export async function checkStudentRequiresAccommodation(studentId: string): Promise<boolean> {
  try {
    console.log('[AccommodationUtils] Checking accommodation status for student:', studentId);

    const assignments = await getStudentServiceAssignments(studentId);
    const hasActiveServices = assignments.some(assignment => assignment.is_active);

    console.log('[AccommodationUtils] Student accommodation status:', {
      studentId,
      activeAssignments: assignments.filter(a => a.is_active).length,
      requiresAccommodation: hasActiveServices
    });

    return hasActiveServices;
  } catch (error) {
    console.warn('[AccommodationUtils] Failed to check accommodation status, defaulting to false:', error);
    return false;
  }
}

/**
 * Check accommodation status for multiple students in batches to avoid overwhelming the API
 */
export async function checkMultipleStudentsAccommodation(
  studentIds: string[],
  batchSize: number = 5
): Promise<Record<string, boolean>> {
  console.log('[AccommodationUtils] Checking accommodation status for', studentIds.length, 'students');

  const results: Record<string, boolean> = {};

  // Process students in batches to avoid overwhelming the API
  for (let i = 0; i < studentIds.length; i += batchSize) {
    const batch = studentIds.slice(i, i + batchSize);

    const batchPromises = batch.map(async (studentId) => {
      const requiresAccommodation = await checkStudentRequiresAccommodation(studentId);
      return { studentId, requiresAccommodation };
    });

    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(({ studentId, requiresAccommodation }) => {
      results[studentId] = requiresAccommodation;
    });

    // Small delay between batches to be nice to the API
    if (i + batchSize < studentIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log('[AccommodationUtils] Batch accommodation check complete:', {
    total: studentIds.length,
    withAccommodations: Object.values(results).filter(Boolean).length
  });

  return results;
}