"""
Enhanced Subject Deletion Rules
Prevents deletion if ANY grade data exists (current or historical)
Implements soft delete (archive) instead
"""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
import logging

class SubjectDeletionManager:
    """Manages subject deletion with proper grade data protection."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
        self.logger = logging.getLogger(__name__)
    
    async def can_delete_subject(self, subject_id: str) -> dict:
        """
        Check if subject can be deleted based on grade data existence.
        Returns detailed analysis of why deletion is/isn't allowed.
        """
        
        # Check for ANY grade data across all possible tables
        grade_checks = {
            'enrollments': await self.session.execute(text("""
                SELECT COUNT(*) FROM enrollments e
                JOIN classrooms c ON e.classroom_id = c.id  
                WHERE c.subject_id = :subject_id
            """)),
            
            'gradebook_entries': await self.session.execute(text("""
                SELECT COUNT(*) FROM gradebook_entries 
                WHERE subject_id = :subject_id
            """)),
            
            'student_grades': await self.session.execute(text("""
                SELECT COUNT(*) FROM student_grades 
                WHERE subject_id = :subject_id  
            """)),
            
            'assignment_submissions': await self.session.execute(text("""
                SELECT COUNT(*) FROM assignments a
                JOIN assignment_submissions s ON a.id = s.assignment_id
                WHERE a.subject_id = :subject_id
            """)),
            
            'attendance_records': await self.session.execute(text("""
                SELECT COUNT(*) FROM attendance_records ar
                JOIN classrooms c ON ar.classroom_id = c.id
                WHERE c.subject_id = :subject_id
            """)),
            
            # Check historical data from previous years
            'historical_transcripts': await self.session.execute(text("""
                SELECT COUNT(*) FROM student_transcripts 
                WHERE subject_id = :subject_id
            """)),
        }
        
        # Execute all checks with subject_id parameter
        results = {}
        total_grade_data = 0
        
        for check_name, query_result in grade_checks.items():
            count = query_result.scalar() or 0
            results[check_name] = count
            total_grade_data += count
        
        # Check if subject is system protected
        system_check = await self.session.execute(text("""
            SELECT is_system_core FROM subjects WHERE id = :subject_id
        """), {"subject_id": subject_id})
        
        is_system_core = system_check.scalar() or False
        
        return {
            'can_delete': total_grade_data == 0 and not is_system_core,
            'total_grade_records': total_grade_data,
            'is_system_core': is_system_core,
            'grade_data_breakdown': results,
            'recommended_action': 'archive' if total_grade_data > 0 else 'delete_allowed'
        }
    
    async def soft_delete_subject(self, subject_id: str, archived_by_user_id: str) -> bool:
        """
        Perform soft delete (archive) of subject.
        Preserves all grade data but removes from active views.
        """
        
        try:
            # Add archived fields if they don't exist
            await self.session.execute(text("""
                ALTER TABLE subjects 
                ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
                ADD COLUMN IF NOT EXISTS archived_date TIMESTAMP,
                ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES users(id)
            """))
            
            # Soft delete the subject
            await self.session.execute(text("""
                UPDATE subjects 
                SET is_archived = TRUE,
                    archived_date = NOW(),
                    archived_by = :archived_by
                WHERE id = :subject_id
            """), {
                "subject_id": subject_id,
                "archived_by": archived_by_user_id
            })
            
            await self.session.commit()
            
            self.logger.info(f"Subject {subject_id} archived by user {archived_by_user_id}")
            return True
            
        except Exception as e:
            await self.session.rollback()
            self.logger.error(f"Failed to archive subject {subject_id}: {str(e)}")
            return False
    
    async def get_deletion_warning_message(self, subject_id: str) -> str:
        """Generate user-friendly warning message explaining why deletion is blocked."""
        
        analysis = await self.can_delete_subject(subject_id)
        
        if analysis['can_delete']:
            return "Subject can be safely deleted."
        
        if analysis['is_system_core']:
            return "Cannot delete system core subject. This subject is required for SIS operation."
        
        if analysis['total_grade_records'] > 0:
            breakdown = analysis['grade_data_breakdown']
            details = []
            
            if breakdown['enrollments'] > 0:
                details.append(f"{breakdown['enrollments']} student enrollments")
            if breakdown['gradebook_entries'] > 0:
                details.append(f"{breakdown['gradebook_entries']} gradebook entries")  
            if breakdown['student_grades'] > 0:
                details.append(f"{breakdown['student_grades']} student grades")
            if breakdown['historical_transcripts'] > 0:
                details.append(f"{breakdown['historical_transcripts']} historical transcript records")
            
            return f"Cannot delete subject with grade data: {', '.join(details)}. Use 'Archive' to hide from active views while preserving academic records."
        
        return "Subject cannot be deleted for unknown reasons."