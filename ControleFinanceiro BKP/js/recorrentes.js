// Função para carregar os recorrentes
async function carregarMenusRecorrentes() {
    //console.log("Iniciando busca no Supabase...");
    const { data: recorrentes, error } = await supabase
        .from('recorrentes')
        .select(`
            rec_id,
            rec_nome,
            rec_valor,
            rec_descricao,
            rec_status,
            tipos:rec_tipo (
                tip_nome
            )
        `);
    
    if (error) {
        console.error('Erro ao buscar recorrentes: ', error);
        return;
    }

    const entradas = recorrentes.filter(item => item.tipos.tip_nome.toLowerCase() === 'entrada');
    const saidas = recorrentes.filter(item => item.tipos.tip_nome.toLowerCase() === 'saida');

    renderizarItensNoMenu(entradas, 'container-entradas-recorrentes');
    renderizarItensNoMenu(saidas, 'container-saidas-recorrentes');
}

// Função para renderizar os itens no HTML
function renderizarItensNoMenu(listaItens, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (listaItens.length === 0) {
        container.innerHTML = '<p class="descricao">Nenhum item cadastrado.</p>';
        return;
    }

    listaItens.forEach(item => {
        const checkedAttribute = item.rec_status ? 'checked' : '';
        const itemHTML = `
            <div class="item">
                <div class="item-dados">
                    <div class="item-header">
                        <input type="checkbox"
                            class="item-checkbox"
                            id="rec-${item.rec_id}"
                            ${checkedAttribute}
                            onchange="alterarStatusRecorrente(${item.rec_id}, this.checked)">
                        <label for="rec-${item.rec_id}" class="titulo-item">${item.rec_nome}</label>
                    </div>
                    <p class="valor">R$ ${Number(item.rec_valor).toFixed(2)}</p>
                    <p class="descricao">${item.rec_descricao || 'Sem descrição.'}</p>
                </div>
                <div class="item-acoes">
                    <button type="button" class="botao-excluir" onclick="excluirRecorrente(${item.rec_id})">Excluir</button>
                </div>
            </div>
        `;

        container.innerHTML += itemHTML;
    });
}

// Função para alterar o status do item para contabilizar na conta do saldo
async function alterarStatusRecorrente(idItem, novoStatus) {
    console.log(`Atualizando item ${idItem} para o status: ${novoStatus}`);

    const { data, error } = await supabase
        .from('recorrentes')
        .update({rec_status: novoStatus})
        .eq('rec_id', idItem);

    if (error) {
        console.error(`Erro ao atualizar o status do item ${idItem}: `, error.message);
        alert('Não foi possível salvar a alteração no banco de dados.');

        const checkbox = document.getElementById(`rec-${idItem}`);
        if (checkbox) checkbox.checked = !novoStatus;
        return;
    }

    console.log(`Item ${idItem} atualizado com sucesso no Supabase!`);
}

// Executar
document.addEventListener("DOMContentLoaded", () => {
    carregarMenusRecorrentes();
    carregarCategoriasDropdown();
    console.log("Busca feita e retornado os itens.")
});

// Função para abrir o Form
function abrirForm(tipoId, nomeTipo) {
    console.log("Tentando abrir o formulário...");
    document.getElementById('form-titulo').innerText = `Nova ${nomeTipo} Recorrente`;
    document.getElementById('form-tipo-id').value = tipoId;

    const botaoSalvar = document.querySelector('.botao-salvar');
    if (botaoSalvar) {
        botaoSalvar.classList.remove('estilo-entrada', 'estilo-saida');
        
        if (nomeTipo.toLowerCase() === 'entrada') {
            botaoSalvar.classList.add('estilo-entrada');
        } else {
            botaoSalvar.classList.add('estilo-saida');
        }
    }

    document.getElementById('form-container').style.display = 'flex';
}

// Função para fechar o Form
function fecharForm() {
    document.getElementById('form-container').style.display = 'none';
    document.getElementById('form-recorrente').reset();

    const btnSalvar = document.querySelector('.botao-salvar');
    if (btnSalvar) {
        btnSalvar.classList.remove('estilo-entrada', 'estilo-saida');
    }
}

// Função que salvar o registro no Supabase
async function salvarNovoRecorrente(event) {
    event.preventDefault();

    const tipoId = document.getElementById('form-tipo-id').value;
    const nome = document.getElementById('form-nome').value;
    const valor = document.getElementById('form-valor').value;
    const categoriaId = document.getElementById('form-categoria').value;
    const descricao = document.getElementById('form-descricao').value;

    console.log("Enviando novo recorrente...");

    const { error} = await supabase
        .from('recorrentes')
        .insert([
            {
                rec_nome: nome,
                rec_valor: parseFloat(valor),
                rec_descricao: descricao,
                rec_tipo: parseInt(tipoId),
                rec_categoria: parseInt(categoriaId),
                rec_status: true
            }
        ]);
    
    if (error) {
        console.error("Erro ao inserir recorrente:", error.message);
        alert("Erro ao salvar no banco de dados.");
        return;
    }

    console.log("Inserido com sucesso!");
    fecharForm();
    carregarMenusRecorrentes();
}

// Função para carregar as categorias no formulário
async function carregarCategoriasDropdown() {
    console.log("Buscando categorias para o dropdown...");

    const { data: categorias, error } = await supabase
        .from('categorias')
        .select('cat_id, cat_nome');

    if (error) {
        console.error("Erro ao buscar categorias: ", error.message);
        return;
    }

    const selectDropdown = document.getElementById('form-categoria');
    selectDropdown.innerHTML = '<option value="" disable selected>Selecione uma categoria...</option>';

    categorias.forEach(cat => {
        const opcao = document.createElement('option');
        opcao.value = cat.cat_id;
        opcao.textContent = cat.cat_nome;
        selectDropdown.appendChild(opcao);
    });
}

// FUnção para excluir um recorrente do Supabase
async function excluirRecorrente(idItem) {
    const confirmar = confirm("Tem certeza que deseja excluir este item?");
    if (!confirmar) return;

    console.log(`Tentando excluir o item ID: ${idItem} no Supabase...`);

    const { error } = await supabase
        .from('recorrentes')
        .delete()
        .eq('rec_id', idItem);

    if (error) {
        console.error("Erro ao excluir do banco de dados: ", error.message);
        alert("Não foi possível excluir o item.");
        return;
    }

    console.log(`Item ${idItem} excluído com sucesso!`);

    carregarMenusRecorrentes();
}