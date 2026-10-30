import { z } from 'zod';
export const projectTypes = ['Website or e-commerce', 'Custom web application', 'UI/UX or prototype', 'CMS or integration', 'Mobile application', 'Maintenance or improvements', 'Not sure yet'] as const;
export const budgetRanges = ['Under $5,000', '$5,000–$15,000', '$15,000–$30,000', '$30,000+', 'Let’s discuss'] as const;
export const contactSchema = z.object({
 name: z.string().trim().min(1, 'Please enter your name.').max(100),
 email: z.email('Please enter a valid email address.').max(254),
 company: z.string().trim().max(150).default(''),
 projectType: z.enum(projectTypes, { error: 'Please choose a project type.' }),
 message: z.string().trim().min(10, 'Please describe your project in at least 10 characters.').max(5000),
 budget: z.union([z.enum(budgetRanges), z.literal('')]).default(''),
 timing: z.string().trim().max(200).default(''),
 website: z.string().max(200).default(''),
 submissionId: z.uuid().optional(),
});
export type ContactFields = Partial<Record<keyof z.infer<typeof contactSchema>, string>>;
