# FabLab — Arquivos atualizados

## Onde colocar cada arquivo

| Arquivo                        | Destino no projeto                              |
|--------------------------------|-------------------------------------------------|
| src/pages/fablab/FabFiles.tsx      | substitui / cria                            |
| src/pages/fablab/FabMaintenance.tsx| substitui / cria                            |
| src/pages/fablab/FabHome.tsx       | substitui                                   |
| src/pages/fablab/FabInventory.tsx  | substitui (adiciona import CSV)             |
| src/App.tsx                        | substitui (novas rotas)                     |
| src/components/layout/Sidebar.tsx  | substitui (novos itens de nav)              |
| LandingPage.tsx                    | substitui (ArcGIS World Imagery no globo)   |
| supabase_setup.sql                 | execute no SQL Editor do Supabase           |

## Novas rotas adicionadas
- `/fablab/maintenance` — Tickets de manutenção de máquinas
- `/fablab/files`       — Arquivos estilo blog (STL, 3MF, GLB, G-Code, SVG, DXF…)

## Supabase: passos obrigatórios
1. Execute `supabase_setup.sql` no SQL Editor
2. Em Storage, crie o bucket `fablab-files` como **público**
3. As políticas RLS já estão no SQL

## Compressão de arquivos
- G-Code, SVG e DXF são comprimidos com gzip nativo do browser antes do upload
- No download, descomprimidos automaticamente — transparente para o usuário
- STL, 3MF, GLB e imagens são enviados sem compressão (já são binários)

## Sistema de posts (FabFiles)
- Mesmo padrão do FabBlog: título, descrição em Markdown, galeria de imagens, tags
- Rascunho / Publicar — rascunhos visíveis apenas para admin/professor
- Galeria com thumbnails clicáveis na página de detalhe
- Download com descompressão automática quando necessário
