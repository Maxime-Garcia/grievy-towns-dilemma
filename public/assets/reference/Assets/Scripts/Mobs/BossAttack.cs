using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class BossAttack : MonoBehaviour
{
    Health hp;
    bool ulti1 = false;
    bool ulti2 = false;
    bool ulti3 = false;
    bool ulti4 = false;
    bool spawnMinion1 = false;
    bool spawnMinion2 = false;

    public bool deplacement;
    // Start is called before the first frame update
    void Start()
    {
        hp = GetComponent<Health>();
    }

    // Update is called once per frame
    void Update()
    {
        if (deplacement)
        {
            if (hp.LifePoints < (0.8 * (float) hp.maxHealth) && !ulti1)
            {
                GetComponent<Animator>().SetTrigger("Ulti");
                ulti1 = true;
            }

            if (hp.LifePoints < (0.6 * (float) hp.maxHealth) && !ulti2)
            {
                GetComponent<Animator>().SetTrigger("Ulti");
                ulti2 = true;
            }

            if (hp.LifePoints < (0.4 * (float) hp.maxHealth) && !ulti3)
            {
                GetComponent<Animator>().SetTrigger("Ulti");
                ulti3 = true;
            }

            if (hp.LifePoints < (0.2 * (float) hp.maxHealth) && !ulti4)
            {
                GetComponent<Animator>().SetTrigger("Ulti");
                ulti4 = true;
            }

            if (hp.LifePoints < (0.5 * (float) hp.maxHealth) && !spawnMinion1)
            {
                gameObject.GetComponent<Boss>().InvokeMinion();
                spawnMinion1 = true;
            }
            if (hp.LifePoints < (0.1 * (float) hp.maxHealth) && !spawnMinion2)
            {
                gameObject.GetComponent<Boss>().InvokeMinion();
                spawnMinion2 = true;
            }
        }
        else
        {
           
            if (hp.LifePoints < (0.8 * (float) hp.maxHealth) && !ulti1)
            {
                GetComponent<InterfaceSpell>().ActivateUltimateF();
                ulti1 = true;
            }

            if (hp.LifePoints < (0.6 * (float) hp.maxHealth) && !ulti2)
            {
                GetComponent<InterfaceSpell>().ActivateUltimateF();
                ulti2 = true;
            }

            if (hp.LifePoints < (0.4 * (float) hp.maxHealth) && !ulti3)
            {
                GetComponent<InterfaceSpell>().ActivateUltimateF();
                ulti3 = true;
            }

            if (hp.LifePoints < (0.2 * (float) hp.maxHealth) && !ulti4)
            {
                GetComponent<InterfaceSpell>().ActivateUltimateF();
                ulti4 = true;
            }
        
            if (hp.LifePoints < (0.5 * (float) hp.maxHealth) && !spawnMinion1)
            {
                gameObject.GetComponent<Boss>().InvokeMinion();
                spawnMinion1 = true;
            }
            if (hp.LifePoints < (0.1 * (float) hp.maxHealth) && !spawnMinion2)
            {
                gameObject.GetComponent<Boss>().InvokeMinion();
                spawnMinion2 = true;
            }
     
        }
    }




}
