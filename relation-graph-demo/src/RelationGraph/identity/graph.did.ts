export const idlFactory = ({ IDL }: { IDL: any }) => {
    return IDL.Service({
      'acl_grant' : IDL.Func([IDL.Text, IDL.Text], [IDL.Text], []),
      'acl_revoke' : IDL.Func([IDL.Text], [IDL.Text], []),
      'acl_show' : IDL.Func([IDL.Nat], [IDL.Text], ['query']),
      'import_schemal' : IDL.Func([IDL.Vec(IDL.Nat8)], [IDL.Text], []),
      'sparql_query' : IDL.Func([IDL.Text, IDL.Text], [IDL.Text], ['query']),
      'sparql_update' : IDL.Func([IDL.Text], [IDL.Text], []),
    })
}
export const init = () => { return [] }