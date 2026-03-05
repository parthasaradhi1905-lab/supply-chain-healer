def validate_action(action):
    """
    Constraint Validator for RL decisions.
    Prevents the agent from executing unsafe or impossible actions in the real system.
    """
    
    # Example constraints:
    # if action.supplier_reliability < 0.6:
    #     return False
    # 
    # if action.port_closed:
    #     return False
    #
    # if action.inventory_after < safety_stock:
    #     return False

    return True
