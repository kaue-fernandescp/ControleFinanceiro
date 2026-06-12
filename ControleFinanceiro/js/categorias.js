// Função para buscar e listar as categorias do Supabase
async function carregarCategorias() {
    console.log("Iniciando busca de categorias no Supabase...");
    
    const { data: categorias, error } = await supabase
        .from('categorias')
        .select('cat_id, cat_nome')
        .order('cat_nome');

    if (error) {
        console.error("Erro ao buscar categorias: ", error.message);
        return;
    }

    console.log("Categorias recebidas do banco: ", categorias);

    const container = document.getElementById('container-lista');
    if (!container) {
        console.error("Erro: ontainer 'container-lista' não encontrado no HTML.");
        return;
    }

    container.innerHTML = '';

    if (categorias.length === 0) {
        container.innerHTML = '<p class="nome-categoria" style="padding: 15px; text-align: center;">Nenhuma categoria cadastrada.</p>';
        return;
    }

    categorias.forEach(cat => {
        const linhaHTML = `
            <div class="linha-categoria">
                <span class="nome-categoria">${cat.cat_nome}</span>
                <div class="botoes-categoria">
                    <button class="botao-editar" onclick="editarCategoria(${cat.cat_id}, '${cat.cat_nome}')">Editar</button>
                    <button class="botao-excluir" onclick="excluirCategoria(${cat.cat_id})">Excluir</button>
                </div>
            </div>
        `;
        container.innerHTML += linhaHTML;
    });
}

// Função para abrir o Form
function abrirForm() {
    console.log("Tentando abrir o formulário...");
    document.getElementById('form-titulo').innerText = "Nova Categoria";
    document.getElementById('form-cat-id').value = "";

    document.getElementById('form-container').style.display = 'flex';
}

// Função para fechar o Form
function fecharForm() {
    document.getElementById('form-container').style.display = 'none';
    document.getElementById('form-categoria').reset();
}

// Função para salvar a categoria
async function salvarNovaCategoria(event) {
    event.preventDefault();

    const idInput = document.getElementById('form-cat-id').value;
    const nomeInput = document.getElementById('form-nome').value.trim();

    if (!nomeInput) return;

    console.log("Iniciando processo de salvamento da categoria...");

    // Adicionar nova categoria
    if (idInput === "") {
        console.log(`Inserindo nova categoria: "${nomeInput}"`);

        const { error } = await supabase
            .from('categorias')
            .insert([{ cat_nome: nomeInput }]);

        if (error) {
            console.error("Erro ao inserir categoria: ", error.message);
            alert("Não foi possível adicionar a categoria.");
            return;
        }
    // Editar categoria
    } else {
        console.log(`Atualizando categoria ID ${idInput} para: "${nomeInput}"`);
        
        const { error } = await supabase
            .from('categorias')
            .update({ cat_nome: nomeInput })
            .eq('cat_id', parseInt(idInput));

        if (error) {
            console.error("Erro ao atualizar categoria:", error.message);
            alert("Não foi possível atualizar a categoria.");
            return;
        }
    }

    console.log("Operação realizada com sucesso!");

    fecharForm();
    carregarCategorias();
}

// Função para jogar os dados da categoria selecionada no formulário
function editarCategoria(idCategoria, nomeCategoria) {
    console.log(`Preparando edição da categoria ID ${idCategoria}: "${nomeCategoria}"`);

    document.getElementById('form-titulo').innerText = "Editar Categoria";

    document.getElementById('form-cat-id').value = idCategoria;
    document.getElementById('form-nome').value = nomeCategoria;

    document.getElementById('form-container').style.display = 'flex';
}

// Função para excluir categoria do Supabase
async function excluirCategoria(idCategoria) {
    const confirmar = confirm("Tem certeza de que deseja excluir esta categoria permanentemente?");

    if (!confirmar) return;

    console.log(`Tentando excluir a categoria ID: ${idCategoria} no Supabase...`);

    const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('cat_id', idCategoria);

    if (error) {
        console.error("Erro ao excluir categoria do banco: ", error.message);
        alert("Não foi possível excluir a categoria. Verifique suas políticas de RLS para DELETE.");
        return;
    }

    console.log(`Categoria ${idCategoria} excluída com sucesso!`);
    
    carregarCategorias();
}

// Executa
document.addEventListener("DOMContentLoaded", () => {
    carregarCategorias();
});