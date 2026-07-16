import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import type { KeyFile } from '@/types/analysis';

const ROLE_COLORS: Record<string, 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'gray'> = {
  '应用入口': 'red',
  '核心业务逻辑': 'blue',
  '数据模型定义': 'purple',
  '路由配置': 'orange',
  '中间件': 'green',
  '工具函数': 'gray',
  '配置文件': 'gray',
};

const TECH_COLORS = ['blue', 'purple', 'green', 'orange'] as const;

export function FilesTab({ keyFiles }: { keyFiles: KeyFile[] }) {
  if (keyFiles.length === 0) {
    return (
      <EmptyState
        title="暂无文件分析数据"
        description="导入 AI 分析后，这里会展示项目中每个关键文件的说明"
      />
    );
  }

  return (
    <div className="space-y-4">
      {keyFiles.map((kf) => (
        <Card key={kf.id} className="p-5">
          <div className="flex items-start justify-between mb-2">
            <code className="text-sm font-mono bg-gray-100 px-3 py-1 rounded text-blue-700 font-medium">
              {kf.filePath}
            </code>
            <Badge color={ROLE_COLORS[kf.role] || 'gray'}>{kf.role}</Badge>
          </div>
          <p className="text-sm text-gray-600 mb-3">{kf.description}</p>
          {kf.keyTechnologies.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {kf.keyTechnologies.map((tech, i) => (
                <Badge key={tech} color={TECH_COLORS[i % TECH_COLORS.length]}>
                  {tech}
                </Badge>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
