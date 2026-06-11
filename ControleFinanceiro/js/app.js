// Configuração das credenciais do Supabase

const SUPABASE_URL = "https://pnrqgotrqxxdnybudesu.supabase.co";
const SUPABASE_KEY = "sb_publishable_3dyJrQV1NVG61gfTlzMb2w_0JLVjo-a";

// Inicialização do cliente do Supabase

window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);