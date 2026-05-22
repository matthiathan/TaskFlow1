export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  parentId?: string | null; // For nesting subtask trees
}

export interface TaskComment {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

export interface ParsedDescription {
  text: string;
  subtasks: Subtask[];
  is_testing?: boolean;
  comments?: TaskComment[];
}

export function parseTaskDescription(description: string | null): ParsedDescription {
  if (!description) {
    return { text: '', subtasks: [], is_testing: false, comments: [] };
  }
  if (description.startsWith('__JSON_DESC__')) {
    try {
      const parsed = JSON.parse(description.substring('__JSON_DESC__'.length));
      return {
        text: parsed.text || '',
        subtasks: parsed.subtasks || [],
        is_testing: !!parsed.is_testing,
        comments: parsed.comments || []
      };
    } catch (e) {
      // Fallback if parsing fails
    }
  }
  
  // Backwards compatibility with standard text description
  return { text: description, subtasks: [], is_testing: false, comments: [] };
}

export function encodeTaskDescription(parsed: ParsedDescription): string {
  return '__JSON_DESC__' + JSON.stringify(parsed);
}

export function getTaskProgress(subtasks: Subtask[]): { total: number; completed: number; percentage: number } {
  if (!subtasks || subtasks.length === 0) {
    return { total: 0, completed: 0, percentage: 0 };
  }
  const completed = subtasks.filter(s => s.completed).length;
  const percentage = Math.round((completed / subtasks.length) * 100);
  return { total: subtasks.length, completed, percentage };
}

export function scanMentions(content: string): string[] {
  const mentions: string[] = [];
  const regex = /@([a-zA-Z0-9_.]+)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    mentions.push(match[1].toLowerCase());
  }
  return mentions;
}

