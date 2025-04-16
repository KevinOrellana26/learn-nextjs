'use server'

//Zod, una biblioteca de validación TypeScript-first 
//que puede simplificarte esta tarea.
import { z } from "zod"
import { revalidatePath } from 'next/cache';
import { redirect } from "next/navigation";
import postgres from "postgres"
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' })

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: "Please select a customer"
    }),
    amount: z.coerce
        .number()
        .gt(0, { message: "Please enter an amount greater than $0." }),
    status: z.enum(['pending', 'paid'], {
        invalid_type_error: 'Please select an invoice status'
    }),
    date: z.string()
})

//Estructura del estado de error
export type State = {
    //errors-> errores de validación por campo
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
    };
    //message-> mensaje general para errores de BD u otros.
    message?: string | null;
}

const CreateInvoice = FormSchema.omit({ id: true, date: true })

export async function createInvoice(prevState: State, formData: FormData) {

    //valida el formulario usando ZOD
    const validateFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    })

    //Si la validación falla, retorna con los valores anteriores, en caso contrario, continua
    if (!validateFields.success) {
        return {
            errors: validateFields.error.flatten().fieldErrors,
            message: "Missing Fields, Failed to Create Invoice",
        };
    }

    //Preparar la data para la inserción en la base de datos
    const { customerId, amount, status } = validateFields.data
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0]

    //Insertamos los datos en la base de datos
    try {
        await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
    } catch (error) {
        // Si la base de datos falla, devuelve un error más específico.
        return {
            message: "Database Error: Failed to Create Invoice"
        }
    }

    //Revalida la cache para la pagina de facturas y redirige al usuario.
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

// Extraemos los datos de formData
// Validar los tipos con Zod
// Convertir el monto a centavos
// Pasar las variables a la consulta SQL
// relativePath -> borrar la cache del cliente y realizar una nueva solicitud de servidor
// redirect -> redirige al usuario a la página de la factura

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, prevState: State, formData: FormData) {

    // validar el formulario usando ZOD
    const validateFields = UpdateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    })

    // Si la validación falla, retorna los valores anteriores, en caso contrario, continua
    if(!validateFields.success){
        return {
            errors: validateFields.error.flatten().fieldErrors,
            message: "Missing Fields, Failed to Update Invoice",
        }
    }

    //Preparar la data para la actualización en la base de datos
    const { customerId, amount, status } = validateFields.data 
    const amountInCents = amount * 100;

    try {
        await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
        `;
    } catch (error) {
        //si la base de datos falla, devuelve un error más específico
       return {
        message: "Database Error: Failed to Update Invoice"
       }
    }

    // Revalida la cache para la pagina de facturas y redirige al usuario
    revalidatePath('/dashboard/invoices')
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
    // throw new Error('Failed to Delete Invoice')

    await sql`
        DELETE FROM invoices WHERE id = ${id}
    `
    revalidatePath('/dashboard/invoices')
}

export async function authenticate(
    prevState: string | undefined,
    formData: FormData
) {
    try {
        await signIn('credentials', formData)
    } catch (error) {
        if(error instanceof AuthError){
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.'            
                default:
                    return 'Something went wrong'
            }
        }
        throw error;
    }
}