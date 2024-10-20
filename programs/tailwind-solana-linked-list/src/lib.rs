use anchor_lang::prelude::*;

declare_id!("2E5C8KgHySisB4xSuh4t6rYHNXQJzKwvgpZGvK5GEP29");

#[program]
pub mod tailwind_solana_linked_list {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, data: u32) -> Result<()> {
        let node = &mut ctx.accounts.node;
        node.data = data;
        node.next = None;
        Ok(())
    }

    pub fn append(ctx: Context<Append>, data: u32) -> Result<()> {
        let current_node = &mut ctx.accounts.current_node;
        let new_node = &mut ctx.accounts.new_node;

        new_node.data = data;
        new_node.next = None;

        current_node.next = Some(new_node.key());
        Ok(())
    }

    pub fn remove(ctx: Context<Remove>) -> Result<()> {
        let current_node = &mut ctx.accounts.current_node;
        let next_node = &mut ctx.accounts.next_node;

        current_node.next = next_node.next;
        Ok(())
    }

    pub fn insert_after(ctx: Context<InsertAfter>, data: u32) -> Result<()> {
        let current_node = &mut ctx.accounts.current_node;
        let new_node = &mut ctx.accounts.new_node;
        let next_node = &mut ctx.accounts.next_node;

        new_node.data = data;
        new_node.next = Some(next_node.key());
        current_node.next = Some(new_node.key());

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 4 + 32 + 1)] // 8 (discriminator) + 4 (data) + 32 (pubkey) + 1 (option) // 8 (discriminator) + 4 (data) + 32 (pubkey)
    pub node: Account<'info, Node>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Append<'info> {
    #[account(mut)]
    pub current_node: Account<'info, Node>,
    #[account(init, payer = user, space = 8 + 4 + 32 + 1)] // 8 (discriminator) + 4 (data) + 32 (pubkey) + 1 (option)
    pub new_node: Account<'info, Node>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Remove<'info> {
    #[account(mut)]
    pub current_node: Account<'info, Node>,
    #[account(mut)]
    pub next_node: Account<'info, Node>,
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct InsertAfter<'info> {
    #[account(mut)]
    pub current_node: Account<'info, Node>,
    #[account(init, payer = user, space = 8 + 4 + 32 + 1)] // 8 (discriminator) + 4 (data) + 32 (pubkey) + 1 (option)
    pub new_node: Account<'info, Node>,
    #[account(mut)]
    pub next_node: Account<'info, Node>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Node {
    pub data: u32,
    pub next: Option<Pubkey>,
}
