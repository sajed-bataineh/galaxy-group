// routes/home.js أو في الملف الحالي
const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const Project = require('../models/Project');
const mongoose = require('mongoose');

// تعديل الروت الحالي
router.get('/', async (req, res) => {
    try {
        // جلب العملاء مع اللوجو للـ news line
        const clients = await Client.find()
            .select('name logo')
            .limit(10);

        // جلب المشاريع المكتملة لقسم Our Work
        const projects = await Project.find()
            .select('name location afterImages description duration')
            .limit(6);

        // جلب جميع صور afterImages من المشاريع للاستخدام العشوائي
        const allProjects = await Project.find()
            .select('afterImages name');
        
        let randomAfterImages = [];
        allProjects.forEach(project => {
            if (project.afterImages && project.afterImages.length > 0) {
                project.afterImages.forEach(img => {
                    randomAfterImages.push({
                        url: img.url,
                        publicId: img.publicId,
                        projectName: project.name
                    });
                });
            }
        });

        // خلط الصور عشوائياً
        randomAfterImages = randomAfterImages.sort(() => 0.5 - Math.random());

        // تمرير البيانات للقالب
        res.render("home/home", { 
            clients: clients,
            projects: projects,
            randomImages: randomAfterImages
        });
        
    } catch (error) {
        console.error('Error fetching home data:', error);
        // في حالة الخطأ، إرسال بيانات فارغة
        res.render("home/home", { 
            clients: [],
            projects: [],
            randomImages: []
        });
    }
});
router.get('/ar', async (req, res) => {
    try {
        // جلب العملاء مع اللوجو للـ news line
        const clients = await Client.find()
            .select('name logo')
            .limit(10);

        // جلب المشاريع المكتملة لقسم Our Work
        const projects = await Project.find()
            .select('name location afterImages description duration')
            .limit(6);

        // جلب جميع صور afterImages من المشاريع للاستخدام العشوائي
        const allProjects = await Project.find()
            .select('afterImages name');
        
        let randomAfterImages = [];
        allProjects.forEach(project => {
            if (project.afterImages && project.afterImages.length > 0) {
                project.afterImages.forEach(img => {
                    randomAfterImages.push({
                        url: img.url,
                        publicId: img.publicId,
                        projectName: project.name
                    });
                });
            }
        });

        // خلط الصور عشوائياً
        randomAfterImages = randomAfterImages.sort(() => 0.5 - Math.random());

        // تمرير البيانات للقالب
        res.render("home/homear", { 
            clients: clients,
            projects: projects,
            randomImages: randomAfterImages
        });
        
    } catch (error) {
        console.error('Error fetching home data:', error);
        // في حالة الخطأ، إرسال بيانات فارغة
        res.render("home/home", { 
            clients: [],
            projects: [],
            randomImages: []
        });
    }
});

router.get('/about', async (req, res) => {
    try {
        // جلب صور عشوائية من afterImages
        const allProjects = await Project.find()
            .select('afterImages name');
        
        let randomAfterImages = [];
        allProjects.forEach(project => {
            if (project.afterImages && project.afterImages.length > 0) {
                project.afterImages.forEach(img => {
                    randomAfterImages.push({
                        url: img.url,
                        publicId: img.publicId,
                        projectName: project.name
                    });
                });
            }
        });

        // خلط الصور عشوائياً
        randomAfterImages = randomAfterImages.sort(() => 0.5 - Math.random());

        res.render("home/about", { 
            randomImages: randomAfterImages
        });
        
    } catch (error) {
        console.error('Error fetching about data:', error);
        res.render("about/about", { 
            randomImages: []
        });
    }
});
router.get('/about/ar', async (req, res) => {
    try {
        // جلب صور عشوائية من afterImages
        const allProjects = await Project.find()
            .select('afterImages name');
        
        let randomAfterImages = [];
        allProjects.forEach(project => {
            if (project.afterImages && project.afterImages.length > 0) {
                project.afterImages.forEach(img => {
                    randomAfterImages.push({
                        url: img.url,
                        publicId: img.publicId,
                        projectName: project.name
                    });
                });
            }
        });

        // خلط الصور عشوائياً
        randomAfterImages = randomAfterImages.sort(() => 0.5 - Math.random());

        res.render("home/aboutar", { 
            randomImages: randomAfterImages
        });
        
    } catch (error) {
        console.error('Error fetching about data:', error);
        res.render("about/about", { 
            randomImages: []
        });
    }
});

router.get('/project/:id', async (req, res) => {
    try {
        const projectId = req.params.id;
        
        // التحقق من صحة الـ ID
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(404).render('error/404', { 
                message: 'Project not found' 
            });
        }

        // جلب تفاصيل المشروع
        const project = await Project.findById(projectId)
            .select('name location duration description beforeImages afterImages videos status createdAt updatedAt');

        if (!project) {
            return res.status(404).render('error/404', { 
                message: 'Project not found' 
            });
        }

        res.render("home/showproject", { 
            project: project,
            pageTitle: `${project.name.en} - Project Details`
        });
        
    } catch (error) {
        console.error('Error fetching project details:', error);
        res.status(500).render('error/500', { 
            message: 'Internal server error while loading project details' 
        });
    }
});
router.get('/project/:id/ar', async (req, res) => {
    try {
        const projectId = req.params.id;
        
        // التحقق من صحة الـ ID
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(404).render('error/404', { 
                message: 'Project not found' 
            });
        }

        // جلب تفاصيل المشروع
        const project = await Project.findById(projectId)
            .select('name location duration description beforeImages afterImages videos status createdAt updatedAt');

        if (!project) {
            return res.status(404).render('error/404', { 
                message: 'Project not found' 
            });
        }

        res.render("home/showprojectar", { 
            project: project,
            pageTitle: `${project.name.en} - Project Details`
        });
        
    } catch (error) {
        console.error('Error fetching project details:', error);
        res.status(500).render('error/500', { 
            message: 'Internal server error while loading project details' 
        });
    }
});

// Route لعرض جميع المشاريع (للربط من الصفحة الرئيسية)
router.get('/project', async (req, res) => {
    try {
        const projects = await Project.find()
            .select('name location afterImages description duration')
            .sort({ createdAt: -1 });

        const allProjects = await Project.find()
            .select('afterImages');
        
        let randomAfterImages = [];
        allProjects.forEach(project => {
            if (project.afterImages && project.afterImages.length > 0) {
                project.afterImages.forEach(img => {
                    randomAfterImages.push({
                        url: img.url,
                        publicId: img.publicId
                    });
                });
            }
        });

        randomAfterImages = randomAfterImages.sort(() => 0.5 - Math.random());

        res.render("home/projects", { 
            projects: projects,
            randomImages: randomAfterImages
        });
        
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.render("home/projects", { 
            projects: [],
            randomImages: []
        });
    }
});

router.get('/projects/ar', async (req, res) => {
    
    try {
        const projects = await Project.find()
            .select('name location afterImages description duration')
            .sort({ createdAt: -1 });

        const allProjects = await Project.find()
            .select('afterImages');
        
        let randomAfterImages = [];
        allProjects.forEach(project => {
            if (project.afterImages && project.afterImages.length > 0) {
                project.afterImages.forEach(img => {
                    randomAfterImages.push({
                        url: img.url,
                        publicId: img.publicId
                    });
                });
            }
        });

        randomAfterImages = randomAfterImages.sort(() => 0.5 - Math.random());

        res.render("home/projectar", { 
            projects: projects,
            randomImages: randomAfterImages
        });
        
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.render("home/projectar", { 
            projects: [],
            randomImages: []
        });
    }
});


router.get('/contact', (req, res) => {
    res.render("home/contact")
});
router.get('/contact/ar', (req, res) => {
    res.render("home/contactar")
});
router.get('/book', (req, res) => {
    res.render("home/book")
});
router.get('/book/ar', (req, res) => {
    res.render("home/bookar")
});
router.get('/faq', (req, res) => {
    res.render("home/faq")
});
router.get('/faq/ar', (req, res) => {
    res.render("home/faqar")
});

module.exports = router;