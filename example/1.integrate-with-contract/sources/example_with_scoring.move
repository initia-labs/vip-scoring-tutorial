// this is an example of how to use scoring in the contract.
// policy for scoring is defined in the function body.
module deployer::example_with_scoring {
    use std::signer;

    use minitia_std::vip_score;
    use deployer::score_helper;

    fun task_1(addr: address) {
        //
        // do something
        // 

        let update_value = 200; // make policy for scoring
        score_helper::update_score(addr, update_value);
    }

    fun task_2(addr: address) {
        //
        // do something
        //

        let increase_value = 100; // make policy for scoring
        score_helper::increase_score(addr, increase_value);
    }

    fun task_3(addr: address) {
        //
        // do something
        //

        let decrease_value = 50; // make policy for scoring
        score_helper::decrease_score(addr, decrease_value);
    }

    public entry fun awesome_fun_1(account: &signer) {
        task_1(signer::address_of(account));
    }

    public entry fun awesome_fun_2(account: &signer) {
        task_2(signer::address_of(account));
    }

    public entry fun aweseme_fun_3(account: &signer) {
        task_3(signer::address_of(account));
    }

    #[test(chain = @0x1, deployer = @deployer, user_a = @0x888, user_b = @0x999)]
    fun test_e2e(
        chain: &signer, deployer: &signer, user_a: &signer, user_b: &signer,
    ) {
        vip_score::init_module_for_test(chain);
        
        score_helper::register_vip_score(deployer);
        vip_score::add_deployer_script(chain, score_helper::get_deployer_object_address());
        score_helper::prepare_stage_script(deployer, 1);

        assert!(vip_score::get_score(signer::address_of(user_a), 1) == 0, 0);
        assert!(vip_score::get_score(signer::address_of(user_b), 1) == 0, 0);

        awesome_fun_1(user_a);
        awesome_fun_2(user_b);
        aweseme_fun_3(user_b);
        
        assert!(vip_score::get_score(signer::address_of(user_a), 1) == 200 , 0);
        assert!(vip_score::get_score(signer::address_of(user_b), 1) == 50 , 0);
        
        score_helper::finalize_stage_script(deployer, 1);

        assert!(vip_score::get_score(signer::address_of(user_a), 2) == 0, 0);
        assert!(vip_score::get_score(signer::address_of(user_b), 2) == 0, 0);
    }
}
