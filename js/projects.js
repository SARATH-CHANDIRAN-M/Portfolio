const projectsKey = [
    {
        title: "M.A.I.D Delivery Robot",
        description: "Autonomous two-wheel drive delivery robot for symposiums using ROS2 navigation stack.",
        tags: ["ROS2", "R-Pi"],
        links: [
            { icon: "fab fa-github", text: "Code", url: "https://github.com/SARATH062005/ROS2_4_wheel", btnClass: "btn-primary" }
        ]
    },
    {
        title: "Yarn Thread Defect Detection",
        description: "Computer Vision pipeline for detecting thin yarn/thread defects using custom dataset.",
        tags: ["OpenCV", "YOLO", "Python"],
        links: [
            { icon: "fab fa-github", text: "Code", url: "https://github.com/SARATH062005/Thread_defect_detection", btnClass: "btn-primary" },
            { icon: "fas fa-image", text: "Demo", url: "https://github.com/SARATH062005/Thread_defect_detection/raw/main/runs/detect/predict4/Thread2.jpg", btnClass: "btn-secondary" }
        ]
    },
    {
        title: "HYDRO TRASH COLLECTOR",
        description: "Patent Project. 500 kg payload delivery robot. Designed entire mechanical structure.",
        tags: ["SolidWorks", "Mech Design"],
        links: [
            { icon: "fas fa-cube", text: "Patent", url: "assets/patent.pdf", btnClass: "btn-primary" }
        ]
    },
    {
        title: "RAG chatbot",
        description: "A local-first Retrieval-Augmented Generation (RAG) system with LLM reasoning.",
        tags: ["LangGraph", "Python", "LLM", "Langchain"],
        links: [
            { icon: "fab fa-github", text: "Code", url: "https://github.com/SARATH062005/RAG-Chat", btnClass: "btn-primary" }
        ]
    },
    {
        title: "LabelImg",
        description: "LabelImg is an open-source image annotation tool. I have contributed to this project by adding new features and fixing bugs.",
        tags: ["Python", "Qt", "OpenCV"],
        links: [
            { icon: "fas fa-file-alt", text: "Docs", url: "https://github.com/SARATH062005/labelImg", btnClass: "btn-secondary" }
        ]
    },
    {
        title: "SO-100-arm",
        description: "SO-100-arm is a 6-axis robot arm with a gripper. I have contributed to this project by adding new features and fixing bugs.",
        tags: ["SolidWorks", "Mech Design", "PCB Design"],
        links: [
            { icon: "fab fa-github", text: "Code", url: "https://github.com/SARATH062005/SO-100-arm", btnClass: "btn-primary" }
        ]
    },
    {

    },
    /* 
    // TEMPLATE: Copy this block to add a new project
    {
        title: "New Project Title",
        description: "Brief description of what this project does.",
        tags: ["Tag1", "Tag2"],
        links: [
            { icon: "fab fa-github", text: "Code", url: "#", btnClass: "btn-primary" },
            { icon: "fas fa-play", text: "Demo", url: "#", btnClass: "btn-secondary" }
        ]
    } 
    */

];

function renderProjects() {
    const container = document.querySelector('#projects .grid');
    if (!container) return;

    container.innerHTML = ''; // Clear existing

    projectsKey.forEach(project => {
        const div = document.createElement('div');
        div.className = 'glass-card p-6 flex flex-col group gs-reveal';

        const tagsHtml = project.tags.map(tag =>
            `<span class="text-xs border border-white/20 px-2 py-1 rounded">${tag}</span>`
        ).join('');

        const linksHtml = project.links.map(link =>
            `<a href="${link.url}" target="_blank" rel="noopener noreferrer" class="project-link ${link.btnClass}"><i class="${link.icon}"></i> ${link.text}</a>`
        ).join('');

        div.innerHTML = `
            <h3 class="text-xl font-bold mb-2 group-hover:text-cyan transition-colors">${project.title}</h3>
            <p class="text-sm mb-4 flex-grow muted-text">${project.description}</p>
            <div class="flex flex-wrap gap-2 mb-6">
                ${tagsHtml}
            </div>
            <div class="flex gap-3">
                ${linksHtml}
            </div>
        `;

        container.appendChild(div);
    });

    // Refresh ScrollTrigger if available
    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
}

// Make it global
window.renderProjects = renderProjects;
window.projectsList = projectsKey;
