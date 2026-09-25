import { z } from 'zod';

const requiredText = (label: string, max = 160) =>
  z
    .string({ error: `${label} é obrigatório.` })
    .trim()
    .min(1, `${label} é obrigatório.`)
    .max(max);

const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, `O texto não pode exceder ${max} caracteres.`)
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .optional();

const optionalUrl = (label: string) =>
  z
    .string()
    .trim()
    .max(500, `${label} é demasiado longo.`)
    .refine(
      (value) => value === '' || /^https?:\/\//i.test(value),
      `${label} deve ser um URL válido.`,
    )
    .transform((value) => (value.length === 0 ? undefined : value))
    .optional();

export const emailSchema = z
  .string({ error: 'O email é obrigatório.' })
  .trim()
  .min(1, 'O email é obrigatório.')
  .email('Introduza um email válido.')
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string({ error: 'A password é obrigatória.' })
  .min(8, 'A password deve ter pelo menos 8 caracteres.');

export const latitudeSchema = z.coerce
  .number({ error: 'A latitude é obrigatória.' })
  .min(-90, 'A latitude deve estar entre -90 e 90.')
  .max(90, 'A latitude deve estar entre -90 e 90.');

export const longitudeSchema = z.coerce
  .number({ error: 'A longitude é obrigatória.' })
  .min(-180, 'A longitude deve estar entre -180 e 180.')
  .max(180, 'A longitude deve estar entre -180 e 180.');

export const bootstrapProfileSchema = z.object({
  name: requiredText('O nome', 120),
  email: emailSchema,
  latitude: latitudeSchema,
  longitude: longitudeSchema,
});

export const registerSchema = z.object({
  name: requiredText('O nome', 120),
  email: emailSchema,
  password: passwordSchema,
  latitude: latitudeSchema,
  longitude: longitudeSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ error: 'A password é obrigatória.' }).min(1, 'A password é obrigatória.'),
});

export const productTypeSchema = z.enum(['product', 'service'], {
  error: 'Seleccione produto ou serviço.',
});
export const productStatusSchema = z.enum(['active', 'inactive', 'archived'], {
  error: 'Seleccione um estado válido.',
});
export const currencySchema = z.literal('AOA', { error: 'A moeda deve ser AOA.' });

const storeBaseSchema = z.object({
  name: requiredText('O nome', 160),
  description: optionalText(1000),
  avatar: optionalText(500),
  cover: optionalText(500),
  address: optionalText(240),
  city: optionalText(120),
  province: optionalText(120),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  phone: optionalText(40),
  whatsapp: optionalText(40),
  email: z.union([emailSchema, z.literal('')]).optional(),
  website: optionalUrl('O website'),
  social_links: z
    .object({
      facebook: optionalUrl('O Facebook'),
      instagram: optionalUrl('O Instagram'),
      tiktok: optionalUrl('O TikTok'),
      youtube: optionalUrl('O YouTube'),
    })
    .default({}),
  is_private: z.boolean().default(false),
});

export const storeSchema = storeBaseSchema;
export const storeUpdateSchema = storeBaseSchema.partial().extend({
  // A partial location update still must contain both coordinates when supplied.
  latitude: latitudeSchema.optional(),
  longitude: longitudeSchema.optional(),
});

export const productSchema = z.object({
  name: requiredText('O nome', 180),
  type: productTypeSchema,
  category_cuid: requiredText('A categoria', 64),
  price: z.coerce
    .number({ error: 'O preço é obrigatório.' })
    .min(0, 'O preço não pode ser negativo.')
    .max(999999999999.99, 'O preço é demasiado elevado.'),
  currency: currencySchema,
  description: optionalText(2000),
  cover: optionalText(500),
  status: productStatusSchema,
});

export const productCreateSchema = productSchema;
export const productUpdateSchema = productSchema.partial();

export const storeHoursSchema = z
  .object({
    day_of_week: z.coerce.number().int().min(0).max(6),
    is_closed: z.boolean(),
    open_time: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Introduza uma hora válida (HH:MM).')
      .nullable()
      .optional(),
    close_time: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Introduza uma hora válida (HH:MM).')
      .nullable()
      .optional(),
  })
  .superRefine((value, context) => {
    if (!value.is_closed) {
      if (!value.open_time) {
        context.addIssue({
          code: 'custom',
          path: ['open_time'],
          message: 'A hora de abertura é obrigatória.',
        });
      }
      if (!value.close_time) {
        context.addIssue({
          code: 'custom',
          path: ['close_time'],
          message: 'A hora de fecho é obrigatória.',
        });
      }
      if (value.open_time && value.close_time && value.open_time >= value.close_time) {
        context.addIssue({
          code: 'custom',
          path: ['close_time'],
          message: 'A hora de fecho deve ser depois da hora de abertura.',
        });
      }
    }
  });

export const storeHoursListSchema = z.array(storeHoursSchema).length(7, 'Devem existir sete dias.');

export const categorySchema = z.object({
  name: requiredText('O nome', 100),
  description: optionalText(500),
});

export const searchSchema = z.object({
  q: z.string().trim().max(120).default(''),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  cursor: z.string().max(500).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(24),
});

export const assetPathSchema = z
  .string()
  .trim()
  .min(1, 'O caminho da imagem é obrigatório.')
  .max(500)
  .refine(
    (value) => !value.includes('..') && !value.startsWith('/'),
    'Caminho de imagem inválido.',
  );

export type BootstrapProfileInput = z.infer<typeof bootstrapProfileSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type StoreInput = z.infer<typeof storeSchema>;
export type StoreUpdateInput = z.infer<typeof storeUpdateSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type StoreHoursInput = z.infer<typeof storeHoursSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type SearchInput = z.infer<typeof searchSchema>;
