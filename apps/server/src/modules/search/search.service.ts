import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type {
  SearchResultsDto,
  SearchProjectResultDto,
  SearchLabelResultDto,
  SearchTaskResultDto,
} from '@todo/shared';

interface SearchQueryRow {
  projects?: SearchProjectResultDto[];
  labels?: SearchLabelResultDto[];
  tasks?: SearchTaskResultDto[];
}

@Injectable()
export class SearchService {
  constructor(private readonly dataSource: DataSource) {}

  async search(ownerId: string, query: string): Promise<SearchResultsDto> {
    const trimmed = query.trim();
    if (!trimmed) {
      return { projects: [], labels: [], tasks: [] };
    }

    // Escape LIKE special characters (% and _)
    const escapedLikePattern = trimmed.replace(/[%_\\]/g, '\\$&');

    return this.dataSource.transaction(async (manager) => {
      await manager.query(`SET LOCAL pg_trgm.similarity_threshold = 0.2;`);

      const sql = `
        WITH
          matched_projects AS (
            SELECT
              p.id,
              p.name,
              p.color_hex_code AS "colorHexCode",
              similarity(p.name, $1) AS score
            FROM projects p
            WHERE p.owner_id = $2
              AND (p.name % $1 OR p.name ILIKE ('%' || $3 || '%'))
            ORDER BY score DESC, p.created_at DESC
            LIMIT 6
          ),
          matched_labels AS (
            SELECT
              l.id,
              l.name,
              l.color_hex_code AS "colorHexCode",
              similarity(l.name, $1) AS score
            FROM task_labels l
            WHERE l.owner_id = $2
              AND (l.name % $1 OR l.name ILIKE ('%' || $3 || '%'))
            ORDER BY score DESC, l.created_at DESC
            LIMIT 6
          ),
          matched_tasks AS (
            SELECT
              t.id,
              t.title,
              t.priority,
              t.completed_at AS "completedAt",
              s.id AS "sectionId",
              s.name AS "sectionName",
              p.id AS "projectId",
              p.name AS "projectName",
              p.color_hex_code AS "projectColorHexCode",
              similarity(t.title, $1) AS score
            FROM tasks t
            INNER JOIN sections s ON s.id = t.section_id
            INNER JOIN projects p ON p.id = s.project_id
            WHERE p.owner_id = $2
              AND (t.title % $1 OR t.title ILIKE ('%' || $3 || '%'))
            ORDER BY score DESC, t.created_at DESC
            LIMIT 10
          )
        SELECT
          (SELECT COALESCE(json_agg(p), '[]'::json) FROM matched_projects p) AS projects,
          (SELECT COALESCE(json_agg(l), '[]'::json) FROM matched_labels l) AS labels,
          (SELECT COALESCE(json_agg(t), '[]'::json) FROM matched_tasks t) AS tasks;
      `;

      const rows: SearchQueryRow[] = await manager.query(sql, [
        trimmed,
        ownerId,
        escapedLikePattern,
      ]);
      const result = rows[0];

      return {
        projects: Array.isArray(result?.projects) ? result.projects : [],
        labels: Array.isArray(result?.labels) ? result.labels : [],
        tasks: Array.isArray(result?.tasks) ? result.tasks : [],
      };
    });
  }
}
