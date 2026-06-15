respect [AGENTS.md](AGENTS.md) / [rules-of-engagement-human-on-the-loop.md](state/rules-of-engagement-human-on-the-loop.md)

inspect the repository and augument a Taskfile.yml with the following tasks:

Taskfile:
    - install
    - info
    - migrate
    - dev
    - shadd 


where shadd =  add shadcn components -> 
```bash
npx shadcn@latest add input table sheet label
```
if no component given -> show a list

task info should advice about usage of .nvmrc node version and pnpm
