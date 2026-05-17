import Card from "../../ui/Card";

const PROJECTS = [
  {
    title: "EasyX 教室预约系统",
    description: "C/C++ 图形界面课程设计。",
  },
  {
    title: "现代登录注册页",
    description: "HTML、CSS、JavaScript 制作的白色高级风登录系统。",
  },
  {
    title: "React LiangOS",
    description: "当前正在构建的 React 个人数字空间。",
  },
];

function ProjectsView() {
  return (
    <section className="bento">
      <section className="bento__span-12">
        <Card title="项目列表" subtitle={`${PROJECTS.length} 个项目`}>
          <ul className="project-list">
            {PROJECTS.map((project) => (
              <li key={project.title} className="project-item">
                <h3>{project.title}</h3>
                <p>{project.description}</p>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </section>
  );
}

export default ProjectsView;
