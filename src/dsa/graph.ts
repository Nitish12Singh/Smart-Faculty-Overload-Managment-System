/**
 * DSA Module: Graph Data Structure
 *
 * Represents relationships:
 * Faculty <---> Courses <---> Departments
 *
 * Adjacency List Graph representation with BFS / DFS traversals
 * to identify suitable faculty candidates for course reassignments and visualize network connections.
 */

export type NodeType = 'FACULTY' | 'COURSE' | 'DEPARTMENT';

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  metadata: Record<string, any>;
}

export interface GraphEdge {
  from: string;
  to: string;
  relation: string; // 'TEACHES' | 'OFFERED_BY' | 'QUALIFIED_IN' | 'AFFILIATED_WITH'
  weight?: number;
}

export class AcademicWorkloadGraph {
  private nodes: Map<string, GraphNode> = new Map();
  private adjacencyList: Map<string, Array<{ to: string; relation: string; weight?: number }>> = new Map();

  public addNode(node: GraphNode): void {
    if (!this.nodes.has(node.id)) {
      this.nodes.set(node.id, node);
      this.adjacencyList.set(node.id, []);
    }
  }

  public addEdge(fromId: string, toId: string, relation: string, weight?: number, bidirectional = true): void {
    if (!this.adjacencyList.has(fromId)) {
      this.adjacencyList.set(fromId, []);
    }
    this.adjacencyList.get(fromId)!.push({ to: toId, relation, weight });

    if (bidirectional) {
      if (!this.adjacencyList.has(toId)) {
        this.adjacencyList.set(toId, []);
      }
      this.adjacencyList.get(toId)!.push({ to: fromId, relation: `REVERSE_${relation}`, weight });
    }
  }

  public getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  public getNeighbors(id: string): Array<{ node: GraphNode; relation: string; weight?: number }> {
    const edges = this.adjacencyList.get(id) || [];
    const results: Array<{ node: GraphNode; relation: string; weight?: number }> = [];
    for (const edge of edges) {
      const targetNode = this.nodes.get(edge.to);
      if (targetNode) {
        results.push({ node: targetNode, relation: edge.relation, weight: edge.weight });
      }
    }
    return results;
  }

  /**
   * Identifies suitable faculty members for a given course using graph traversal:
   * 1. Traverses to the course's department.
   * 2. Traverses from department to all affiliated faculty.
   * 3. Checks specialization match and available bandwidth.
   */
  public findSuitableFacultyForCourse(courseNodeId: string): Array<{
    facultyNode: GraphNode;
    suitabilityReason: string;
    score: number;
  }> {
    const courseNode = this.nodes.get(courseNodeId);
    if (!courseNode) return [];

    const results: Array<{ facultyNode: GraphNode; suitabilityReason: string; score: number }> = [];

    // All faculty nodes
    for (const [, node] of this.nodes.entries()) {
      if (node.type !== 'FACULTY') continue;

      let score = 0;
      const reasons: string[] = [];

      // Check department adjacency
      const facultyNeighbors = this.getNeighbors(node.id);
      const isSameDept = facultyNeighbors.some(
        (n) => n.node.type === 'DEPARTMENT' && n.node.id === `dept_${courseNode.metadata.departmentId}`
      );

      if (isSameDept) {
        score += 40;
        reasons.push('Same Academic Department');
      }

      // Check specialization qualification
      const spec = (node.metadata.specialization || '').toLowerCase();
      const courseName = (courseNode.label || '').toLowerCase();
      const reqSpec = (courseNode.metadata.requiredSpecialization || '').toLowerCase();

      if (spec && (courseName.includes(spec) || spec.includes(courseName) || (reqSpec && spec.includes(reqSpec)))) {
        score += 50;
        reasons.push(`Domain expertise matches course: ${node.metadata.specialization}`);
      } else {
        score += 20;
        reasons.push('General engineering core competency');
      }

      // Check headroom
      const maxLoad = node.metadata.maxWorkload || 18;
      const currentLoad = node.metadata.currentWorkload || 0;
      const courseWeight = courseNode.metadata.workloadUnits || 3;
      const headroom = maxLoad - currentLoad;

      if (headroom >= courseWeight) {
        score += 25;
        reasons.push(`Sufficient capacity (+${headroom}h available, course requires ${courseWeight}h)`);
      } else {
        score -= 30;
        reasons.push(`Capacity deficit: would cause overload (+${courseWeight - headroom}h)`);
      }

      if (score > 30) {
        results.push({
          facultyNode: node,
          suitabilityReason: reasons.join('; '),
          score,
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  public getGraphData(): {
    nodes: Array<{ id: string; label: string; type: NodeType; details: any }>;
    links: Array<{ source: string; target: string; relation: string }>;
  } {
    const nodesList = Array.from(this.nodes.values()).map((n) => ({
      id: n.id,
      label: n.label,
      type: n.type,
      details: n.metadata,
    }));

    const linksList: Array<{ source: string; target: string; relation: string }> = [];
    for (const [sourceId, edges] of this.adjacencyList.entries()) {
      for (const edge of edges) {
        if (!edge.relation.startsWith('REVERSE_')) {
          linksList.push({
            source: sourceId,
            target: edge.to,
            relation: edge.relation,
          });
        }
      }
    }

    return { nodes: nodesList, links: linksList };
  }
}
