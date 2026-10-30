export const site = { name: 'OpenBracket', url: 'https://openbracket.io', email: 'tam@openbracket.io', phone: '817-845-1242', location: 'Dallas–Fort Worth, Texas' };
export const navigation = [{ href: '/', label: 'Home' }, { href: '/services', label: 'Services' }, { href: '/about', label: 'About' }, { href: '/work', label: 'Work' }];
export const clients: { name: string; asset: string; alt: string; url?: string }[] = [];
export const services = [
 { id: 'websites', title: 'Websites & e-commerce', short: 'A clearer, more effective website.', description: 'Give people a clear picture of your business and an easier path to getting in touch or buying from you.', includes: 'Website design and development, existing-site redesigns, responsive layouts, content planning, and online stores.', next: 'Tell us what your current site needs to do better.' },
 { id: 'applications', title: 'Custom web applications', short: 'Tools that work the way you do.', description: 'When a spreadsheet or an off-the-shelf tool no longer fits, a purpose-built application can support the way your business works.', includes: 'Workflow discovery, interface design, application development, connected data, and testing.', next: 'Walk us through the task you want to make easier.' },
 { id: 'design', title: 'UI/UX & prototyping', short: 'Make the idea tangible.', description: 'Explore how a product should feel and work before committing to the full build.', includes: 'User flows, wireframes, interface design, interactive prototypes, and review of the proposed experience.', next: 'Bring the idea, even if it is still a rough sketch.' },
 { id: 'integrations', title: 'CMS & API integrations', short: 'Less friction. More connection.', description: 'Make content easier to manage and help the systems you rely on work together.', includes: 'CMS implementation, bespoke themes and plugins, API integrations, content migration planning, and editing guidance.', next: 'Tell us which tools and content need to connect.' },
 { id: 'mobile', title: 'Mobile application projects', short: 'Start with the right fit.', description: 'Have an idea for a mobile app? Let’s talk through the users, features, and platform needs to understand the best approach.', includes: 'Discovery, scope definition, interface exploration, and a discussion of development options suited to the project.', next: 'Let’s discuss whether a mobile app is the right next step.' },
 { id: 'support', title: 'Maintenance & improvements', short: 'Keep your website moving forward.', description: 'A useful website needs attention after launch. Plan for updates, practical improvements, and dependable operation.', includes: 'Maintenance, performance and accessibility improvements, hosting coordination, deployment, analytics setup, and monitoring.', next: 'Tell us what you have and where you need support.' },
];
export const process = [
 { title: 'Discover', text: 'Understand your business, your users, and what a useful result looks like.' },
 { title: 'Design', text: 'Shape the experience, explore the details, and test the direction together.' },
 { title: 'Build', text: 'Develop the pieces, connect your systems, and validate how everything works.' },
 { title: 'Launch & improve', text: 'Deploy thoughtfully, support the handover, and plan what comes next.' },
];
