using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class WaterUlti : MonoBehaviour, InterfaceSpell
{
    public bool ActiveUltimate;
    public float Delay;

    public GameObject FirstWave;
    public GameObject SecondWave;
    public GameObject ThirdWave;
    private Vector3 pos;
    
   

    // Update is called once per frame
    void Update()
    {
        if (ActiveUltimate)
        {
            StartCoroutine(Ultimate());
            ActiveUltimate = false;
        }
        
        pos = transform.position;
    }

    private IEnumerator Ultimate()
    {
        
        Instantiate(FirstWave, pos, transform.rotation);
        yield return new WaitForSeconds(Delay);
        Instantiate(SecondWave, pos, transform.rotation);
        yield return new WaitForSeconds(Delay);
        Instantiate(ThirdWave, pos, transform.rotation);
        yield return new WaitForSeconds(Delay);
        
    }

    public void ActivateUltimateF()
    {
        ActiveUltimate = true;
    }
}
